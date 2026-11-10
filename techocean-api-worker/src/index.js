// ============================================================
// TechOcean — Worker principal (Hono + D1)
// ============================================================
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyJWT, getActiveSession, touchSession, hashPassword } from './auth.js';
import { authMiddleware, requireRole, audit } from './middleware.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import opRoutes from './routes/operacional.js';
import pubRoutes from './routes/public.js';

const app = new Hono();

// ---------- CORS ----------
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://techocean.pages.dev',
      'http://localhost:5173',
      'http://localhost:8788',
    ];
    return allowed.includes(origin) ? origin : null;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// ---------- Rotas públicas ----------
app.route('/', pubRoutes);

// ---------- Rotas de autenticação (login, setup, password reset, health) ----------
app.route('/', authRoutes);

// ---------- Rotas administrativas (ADMIN only) ----------
app.route('/', adminRoutes);

// ---------- Rotas operacionais (profissionais autenticados) ----------
app.route('/', opRoutes);

// ---------- Backup admin completo (ADMIN only) ----------
app.post('/api/backup/admin/completo', authMiddleware, requireRole('ADMIN'), async (c) => {
  const user = c.get('user');
  const tables = [
    'usuario', 'usuario_admin', 'cliente', 'carga', 'conteiner',
    'solicitacao', 'operacao', 'orcamento', 'servico', 'agendamento',
    'mensagem', 'mensagem_contato', 'relatorio', 'auth_session',
    'audit_event', 'backup_record',
  ];
  const data = {};
  for (const t of tables) {
    const r = await c.env.DB.prepare(`SELECT * FROM ${t}`).all();
    data[t] = r.results;
  }
  await audit(c, 'BKP-003', 'Backup admin completo gerado', '/api/backup/admin/completo');
  return c.json({ backup: data, generated_at: new Date().toISOString(), generated_by: user.nome });
});

// ---------- Mensagem do cliente (autenticado como CLIENTE) ----------
app.post('/api/cliente/mensagens', async (c) => {
  // Middleware inline para cliente
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Token não fornecido' }, 401);

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.APP_AUTH_SECRET);
  if (!payload || payload.type !== 'CLIENTE') return c.json({ error: 'Acesso restrito a clientes' }, 403);

  const session = await getActiveSession(c.env.DB, payload.sid);
  if (!session) return c.json({ error: 'Sessão encerrada' }, 401);
  await touchSession(c.env.DB, session.id);

  const { especialista, conteudo } = await c.req.json();
  if (!especialista || !conteudo) {
    return c.json({ error: 'especialista e conteudo são obrigatórios' }, 400);
  }

  const r = await c.env.DB.prepare(
    "INSERT INTO mensagem (cliente_id, especialista, conteudo, status) VALUES (?, ?, ?, 'ENVIADO')"
  ).bind(payload.sub, especialista, conteudo).run();

  return c.json({ id: r.meta.last_row_id, message: 'Mensagem enviada' }, 201);
});

// ---------- Lista de mensagens do cliente (autenticado como CLIENTE) ----------
app.get('/api/cliente/mensagens', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Token não fornecido' }, 401);

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.APP_AUTH_SECRET);
  if (!payload || payload.type !== 'CLIENTE') return c.json({ error: 'Acesso restrito a clientes' }, 403);

  const session = await getActiveSession(c.env.DB, payload.sid);
  if (!session) return c.json({ error: 'Sessão encerrada' }, 401);
  await touchSession(c.env.DB, session.id);

  const r = await c.env.DB.prepare(
    'SELECT * FROM mensagem WHERE cliente_id = ? ORDER BY id DESC'
  ).bind(payload.sub).all();
  return c.json(r.results);
});

// ---------- 404 fallback ----------
app.notFound((c) => c.json({ error: 'Endpoint não encontrado' }, 404));

// ---------- Error handler ----------
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Erro interno do servidor', detail: err.message }, 500);
});

export default app;
