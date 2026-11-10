// ============================================================
// TechOcean — Rotas de Autenticação
// ============================================================
import { Hono } from 'hono';
import {
  hashPassword, comparePassword, generateToken, generateUUID,
  createAuthResponse, findProfessionalByEmail,
  endSession, endAllUserSessions, sha256, logAudit,
} from '../auth.js';
import { authMiddleware, audit } from '../middleware.js';

const auth = new Hono();

// ---------- Health ----------
auth.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---------- Admin Setup (primeiro admin) ----------
auth.post('/admin/setup', async (c) => {
  const { nome, email, senha } = await c.req.json();
  if (!nome || !email || !senha) {
    return c.json({ error: 'nome, email e senha são obrigatórios' }, 400);
  }
  if (senha.length < 8) {
    return c.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  const config = await c.env.DB.prepare('SELECT enabled FROM admin_setup_config WHERE id = 1').first();
  if (config && !config.enabled) {
    return c.json({ error: 'Setup inicial desativado' }, 403);
  }

  const lock = await c.env.DB.prepare("SELECT id FROM admin_bootstrap_lock WHERE id = 'ADMIN_BOOTSTRAP'").first();
  if (lock) {
    return c.json({ error: 'Administrador inicial já foi criado' }, 409);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM usuario_admin WHERE cargo = 'ADMIN' LIMIT 1").first();
  if (existing) {
    return c.json({ error: 'Já existe um administrador cadastrado' }, 409);
  }

  const senhaHash = await hashPassword(senha);
  await c.env.DB.prepare(
    'INSERT INTO usuario_admin (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
  ).bind(nome, email, senhaHash, 'ADMIN').run();

  await c.env.DB.prepare("INSERT INTO admin_bootstrap_lock (id) VALUES ('ADMIN_BOOTSTRAP')").run();
  await c.env.DB.prepare('UPDATE admin_setup_config SET enabled = 0 WHERE id = 1').run();

  await logAudit(c.env.DB, {
    eventCode: `EVT-${Date.now()}`, actionCode: 'ADM-001',
    actionDescription: `Admin inicial criado: ${email}`,
    actorName: nome, actorRole: 'ADMIN',
    action: 'POST', method: 'POST', resource: '/admin/setup',
  });

  return c.json({ message: 'Administrador inicial criado com sucesso' }, 201);
});

// ---------- Login profissional ----------
auth.post('/admin/login', async (c) => {
  const { email, senha } = await c.req.json();
  if (!email || !senha) return c.json({ error: 'email e senha são obrigatórios' }, 400);

  const user = await findProfessionalByEmail(c.env.DB, email);
  if (!user) return c.json({ error: 'Credenciais inválidas' }, 401);

  const valid = await comparePassword(senha, user.senha);
  if (!valid) return c.json({ error: 'Credenciais inválidas' }, 401);

  const authResult = await createAuthResponse(c.env.DB, user, 'PROFESSIONAL', c.env.APP_AUTH_SECRET);

  await logAudit(c.env.DB, {
    actorId: user.id, sessionId: authResult.session.id,
    actorName: user.nome, actorRole: user.role,
    eventCode: `EVT-${Date.now()}`, actionCode: 'AUTH-001',
    actionDescription: `Login profissional: ${email}`,
    action: 'POST', method: 'POST', resource: '/admin/login',
  });

  return c.json(authResult);
});

// ---------- Login cliente ----------
auth.post('/clientes/login', async (c) => {
  const { email, senha } = await c.req.json();
  if (!email || !senha) return c.json({ error: 'email e senha são obrigatórios' }, 400);

  const cliente = await c.env.DB.prepare('SELECT * FROM cliente WHERE email = ?').bind(email).first();
  if (!cliente) return c.json({ error: 'Credenciais inválidas' }, 401);

  const valid = await comparePassword(senha, cliente.senha);
  if (!valid) return c.json({ error: 'Credenciais inválidas' }, 401);

  const clienteForAuth = { id: cliente.id, nome: cliente.nome, email: cliente.email, role: 'CLIENTE' };
  const authResult = await createAuthResponse(c.env.DB, clienteForAuth, 'CLIENTE', c.env.APP_AUTH_SECRET);
  return c.json(authResult);
});

// ---------- Logout ----------
auth.post('/auth/logout', authMiddleware, async (c) => {
  const session = c.get('session');
  await endSession(c.env.DB, session.id);
  await audit(c, 'AUTH-002', 'Logout', '/auth/logout');
  return c.json({ message: 'Sessão encerrada' });
});

// ---------- Password Reset: Request ----------
auth.post('/auth/password-reset/request', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'email é obrigatório' }, 400);

  // Busca em ambas as tabelas
  const admin = await c.env.DB.prepare('SELECT * FROM usuario_admin WHERE email = ?').bind(email).first();
  const user = await c.env.DB.prepare('SELECT * FROM usuario WHERE email = ?').bind(email).first();
  const cliente = await c.env.DB.prepare('SELECT * FROM cliente WHERE email = ?').bind(email).first();

  const found = admin || user || cliente;
  if (found) {
    const rawToken = generateToken();
    const tokenHash = await sha256(rawToken);
    const accountType = admin ? 'ADMIN' : user ? 'FUNCIONARIO' : 'CLIENTE';
    const accountId = found.id;
    const expires = new Date(Date.now() + 3600000).toISOString();

    await c.env.DB.prepare(
      'INSERT INTO password_reset_token (id, token_hash, account_type, account_id, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(generateUUID(), tokenHash, accountType, accountId, expires).run();

    // Em produção: enviar por email. Sem SMTP, retorna o token (apenas dev).
    await logAudit(c.env.DB, {
      actorId: accountId, actorName: found.nome, actorRole: accountType,
      eventCode: `EVT-${Date.now()}`, actionCode: 'AUTH-003',
      actionDescription: `Solicitação de reset de senha: ${email}`,
      action: 'POST', method: 'POST', resource: '/auth/password-reset/request',
    });

    return c.json({ message: 'Token de recuperação gerado', token: rawToken });
  }

  // Não revela se email existe
  return c.json({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado' });
});

// ---------- Password Reset: Confirm ----------
auth.post('/auth/password-reset/confirm', async (c) => {
  const { token, novaSenha } = await c.req.json();
  if (!token || !novaSenha) return c.json({ error: 'token e novaSenha são obrigatórios' }, 400);
  if (novaSenha.length < 8) return c.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);

  const tokenHash = await sha256(token);
  const resetToken = await c.env.DB.prepare(
    "SELECT * FROM password_reset_token WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')"
  ).bind(tokenHash).first();

  if (!resetToken) return c.json({ error: 'Token inválido ou expirado' }, 400);

  const senhaHash = await hashPassword(novaSenha);

  // Atualiza senha na tabela correta
  if (resetToken.account_type === 'CLIENTE') {
    await c.env.DB.prepare("UPDATE cliente SET senha = ? WHERE id = ?").bind(senhaHash, resetToken.account_id).run();
  } else if (resetToken.account_type === 'ADMIN') {
    await c.env.DB.prepare("UPDATE usuario_admin SET senha = ? WHERE id = ?").bind(senhaHash, resetToken.account_id).run();
  } else {
    await c.env.DB.prepare("UPDATE usuario SET senha = ? WHERE id = ?").bind(senhaHash, resetToken.account_id).run();
  }

  await c.env.DB.prepare("UPDATE password_reset_token SET used_at = datetime('now') WHERE id = ?").bind(resetToken.id).run();

  // Encerra todas as sessões ativas (correção da vulnerabilidade #1)
  await endAllUserSessions(c.env.DB, resetToken.account_id);

  await logAudit(c.env.DB, {
    actorId: resetToken.account_id, actorRole: resetToken.account_type,
    eventCode: `EVT-${Date.now()}`, actionCode: 'AUTH-004',
    actionDescription: 'Senha redefinida e sessões encerradas',
    action: 'POST', method: 'POST', resource: '/auth/password-reset/confirm',
  });

  return c.json({ message: 'Senha redefinida com sucesso' });
});

export default auth;
