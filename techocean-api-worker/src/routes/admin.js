// ============================================================
// TechOcean — Rotas Administrativas
// ============================================================
import { Hono } from 'hono';
import { hashPassword, endSession, endAllUserSessions } from '../auth.js';
import { authMiddleware, requireRole, audit } from '../middleware.js';

const admin = new Hono();

admin.use('*', authMiddleware);
admin.use('*', requireRole('ADMIN'));

// ---------- Listar todos os profissionais (usuario + usuario_admin) ----------
admin.get('/admin/usuarios', async (c) => {
  const admins = await c.env.DB.prepare(
    "SELECT id, nome, email, cargo as role, 'ADMIN_TABLE' as tabela FROM usuario_admin"
  ).all();
  const users = await c.env.DB.prepare(
    "SELECT id, nome, email, 'FUNCIONARIO' as role, 'USUARIO_TABLE' as tabela FROM usuario"
  ).all();
  return c.json([...admins.results, ...users.results]);
});

// ---------- Criar profissional ----------
admin.post('/admin/usuarios', async (c) => {
  const { nome, email, senha, role, CPFCNPJ } = await c.req.json();
  if (!nome || !email || !senha || !role) {
    return c.json({ error: 'nome, email, senha e role são obrigatórios' }, 400);
  }
  if (!['ADMIN', 'SUPERVISOR', 'FUNCIONARIO'].includes(role)) {
    return c.json({ error: 'role inválido' }, 400);
  }

  // Verifica duplicidade em ambas as tabelas
  const inAdmin = await c.env.DB.prepare('SELECT id FROM usuario_admin WHERE email = ?').bind(email).first();
  const inUser = await c.env.DB.prepare('SELECT id FROM usuario WHERE email = ?').bind(email).first();
  if (inAdmin || inUser) return c.json({ error: 'Email já cadastrado' }, 409);

  const senhaHash = await hashPassword(senha);

  if (role === 'ADMIN' || role === 'SUPERVISOR') {
    await c.env.DB.prepare(
      'INSERT INTO usuario_admin (nome, email, senha, cargo) VALUES (?, ?, ?, ?)'
    ).bind(nome, email, senhaHash, role).run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO usuario (nome, CPFCNPJ, email, senha) VALUES (?, ?, ?, ?)'
    ).bind(nome, CPFCNPJ || '', email, senhaHash).run();
  }

  await audit(c, 'ADM-002', `Usuário criado: ${email} (${role})`, '/admin/usuarios');
  return c.json({ message: 'Usuário criado' }, 201);
});

// ---------- Atualizar profissional ----------
admin.put('/admin/usuarios/:id', async (c) => {
  const id = c.req.param('id');
  const tabela = c.req.query('tabela') || 'USUARIO_TABLE';
  const { nome, email, role, senha, CPFCNPJ, ativo } = await c.req.json();

  const table = tabela === 'ADMIN_TABLE' ? 'usuario_admin' : 'usuario';

  if (senha) {
    const senhaHash = await hashPassword(senha);
    if (table === 'usuario_admin') {
      await c.env.DB.prepare('UPDATE usuario_admin SET nome = ?, email = ?, senha = ?, cargo = ? WHERE id = ?')
        .bind(nome, email, senhaHash, role).bind(id).run();
    } else {
      await c.env.DB.prepare('UPDATE usuario SET nome = ?, CPFCNPJ = ?, email = ?, senha = ? WHERE id = ?')
        .bind(nome, CPFCNPJ, email, senhaHash, id).run();
    }
    await endAllUserSessions(c.env.DB, parseInt(id));
  } else {
    if (table === 'usuario_admin') {
      await c.env.DB.prepare('UPDATE usuario_admin SET nome = ?, email = ?, cargo = ? WHERE id = ?')
        .bind(nome, email, role, id).run();
    } else {
      await c.env.DB.prepare('UPDATE usuario SET nome = ?, CPFCNPJ = ?, email = ? WHERE id = ?')
        .bind(nome, CPFCNPJ, email, id).run();
    }
  }

  await audit(c, 'ADM-003', `Usuário atualizado: ${id}`, '/admin/usuarios', id);
  return c.json({ message: 'Usuário atualizado' });
});

// ---------- Excluir profissional ----------
admin.delete('/admin/usuarios/:id', async (c) => {
  const id = c.req.param('id');
  const tabela = c.req.query('tabela') || 'USUARIO_TABLE';
  const table = tabela === 'ADMIN_TABLE' ? 'usuario_admin' : 'usuario';
  const user = c.get('user');

  if (user.sub == id && tabela === 'ADMIN_TABLE') {
    return c.json({ error: 'Não é possível excluir o próprio usuário' }, 400);
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(id).first();
  if (!existing) return c.json({ error: 'Usuário não encontrado' }, 404);

  await endAllUserSessions(c.env.DB, parseInt(id));
  await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  await audit(c, 'ADM-004', `Usuário excluído: ${id}`, '/admin/usuarios', id);
  return c.json({ message: 'Usuário excluído' });
});

// ---------- Sessões ----------
admin.get('/admin/sessoes', async (c) => {
  const sessions = await c.env.DB.prepare(
    'SELECT * FROM auth_session ORDER BY started_at DESC'
  ).all();
  return c.json(sessions.results);
});

admin.get('/admin/sessoes/:id/auditoria', async (c) => {
  const sessionId = c.req.param('id');
  const events = await c.env.DB.prepare(
    'SELECT * FROM audit_event WHERE session_id = ? ORDER BY occurred_at DESC'
  ).bind(sessionId).all();
  return c.json(events.results);
});

admin.post('/admin/sessoes/:id/encerrar', async (c) => {
  await endSession(c.env.DB, c.req.param('id'));
  await audit(c, 'ADM-005', `Sessão encerrada: ${c.req.param('id')}`, '/admin/sessoes', c.req.param('id'));
  return c.json({ message: 'Sessão encerrada' });
});

// ---------- Auditoria ----------
admin.get('/admin/auditoria', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500);
  const events = await c.env.DB.prepare(
    'SELECT * FROM audit_event ORDER BY occurred_at DESC LIMIT ?'
  ).bind(limit).all();
  return c.json(events.results);
});

// ---------- Configuração de Setup ----------
admin.get('/admin/setup-config', async (c) => {
  const config = await c.env.DB.prepare('SELECT * FROM admin_setup_config WHERE id = 1').first();
  return c.json(config || { id: 1, enabled: 0 });
});

admin.put('/admin/setup-config', async (c) => {
  const { enabled } = await c.req.json();
  await c.env.DB.prepare('UPDATE admin_setup_config SET enabled = ? WHERE id = 1').bind(enabled ? 1 : 0).run();
  await audit(c, 'ADM-006', `Setup ${enabled ? 'habilitado' : 'desabilitado'}`, '/admin/setup-config');
  return c.json({ message: 'Configuração atualizada' });
});

export default admin;
