// ============================================================
// TechOcean — Middleware (Auth, RBAC, Auditoria)
// ============================================================
import { verifyJWT, touchSession, getActiveSession, logAudit } from './auth.js';

// Extrai e valida o token JWT do header Authorization
export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido' }, 401);
  }
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.APP_AUTH_SECRET);
  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado' }, 401);
  }

  // Valida sessão ativa pelo sid (UUID) do JWT
  const session = await getActiveSession(c.env.DB, payload.sid);
  if (!session) {
    return c.json({ error: 'Sessão encerrada' }, 401);
  }

  // Atualiza última atividade
  await touchSession(c.env.DB, session.id);

  c.set('user', payload);
  c.set('session', session);
  await next();
}

// RBAC — verifica se o usuário tem um dos papéis permitidos
export function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Não autenticado' }, 401);
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Acesso negado: papel insuficiente' }, 403);
    }
    await next();
  };
}

// Permite acesso de qualquer profissional autenticado
export async function requireProfessional(c, next) {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Não autenticado' }, 401);
  if (user.type !== 'PROFESSIONAL') {
    return c.json({ error: 'Acesso restrito a profissionais' }, 403);
  }
  await next();
}

// Bloqueia FUNCIONARIO de fazer DELETE
export async function blockFuncionarioDelete(c, next) {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Não autenticado' }, 401);
  if (user.role === 'FUNCIONARIO' && c.req.method === 'DELETE') {
    return c.json({ error: 'Funcionários não têm permissão de exclusão' }, 403);
  }
  await next();
}

// Helper para registrar auditoria
export async function audit(c, actionCode, actionDescription, resource = '', resourceId = null) {
  const user = c.get('user');
  const session = c.get('session');
  const eventCode = `EVT-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 8)}`;
  await logAudit(c.env.DB, {
    actorId: user?.sub,
    sessionId: session?.id,
    actorName: user?.nome,
    actorRole: user?.role,
    eventCode,
    actionCode,
    actionDescription,
    action: c.req.method,
    method: c.req.method,
    resource: resource || c.req.path,
    resourceId,
    responseStatus: c.res.status,
    ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
  });
}
