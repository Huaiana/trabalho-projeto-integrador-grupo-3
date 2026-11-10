// ============================================================
// TechOcean — Rotas Públicas (sem autenticação)
// ============================================================
import { Hono } from 'hono';
import { hashPassword } from '../auth.js';

const pub = new Hono();

// ---------- Lista pública de serviços ----------
pub.get('/servicos', async (c) => {
  const r = await c.env.DB.prepare('SELECT id, nome, descricao, categoria, disponivel FROM servico WHERE disponivel = 1 ORDER BY id DESC').all();
  return c.json(r.results);
});

// ---------- Cadastro público de cliente ----------
pub.post('/clientes', async (c) => {
  const { nome, CPFCNPJ, telefone, email, senha } = await c.req.json();
  if (!nome || !CPFCNPJ || !telefone || !email || !senha) {
    return c.json({ error: 'nome, CPFCNPJ, telefone, email e senha são obrigatórios' }, 400);
  }
  if (senha.length < 8) {
    return c.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM cliente WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email já cadastrado' }, 409);

  const senhaHash = await hashPassword(senha);
  const r = await c.env.DB.prepare(
    'INSERT INTO cliente (nome, CPFCNPJ, telefone, email, senha) VALUES (?, ?, ?, ?, ?)'
  ).bind(nome, CPFCNPJ, telefone, email, senhaHash).run();

  return c.json({ id: r.meta.last_row_id, message: 'Cliente cadastrado com sucesso' }, 201);
});

// ---------- Formulário de contato (mensagem_contato) ----------
pub.post('/mensagens/contatos', async (c) => {
  const { nome, email, conteudo } = await c.req.json();
  if (!nome || !email || !conteudo) {
    return c.json({ error: 'nome, email e conteudo são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    "INSERT INTO mensagem_contato (nome, email, conteudo, status) VALUES (?, ?, ?, 'ENVIADO')"
  ).bind(nome, email, conteudo).run();
  return c.json({ id: r.meta.last_row_id, message: 'Mensagem enviada com sucesso' }, 201);
});

// ---------- Agendamento público (cria usuario + agendamento) ----------
// Campos transient do Agendamento: nome, email, cpf, senha, confirmacao
// Campos persistidos: dataHora, telefone, status, usuario_id
pub.post('/agendamentos', async (c) => {
  const { dataHora, telefone, nome, email, cpf, senha, confirmacao } = await c.req.json();
  if (!dataHora || !telefone) {
    return c.json({ error: 'dataHora e telefone são obrigatórios' }, 400);
  }

  // Busca ou cria usuario (não cliente — Agendamento relaciona-se com Usuario)
  let usuario = await c.env.DB.prepare('SELECT id FROM usuario WHERE email = ?').bind(email).first();

  if (!usuario && nome && email && cpf && senha) {
    // Cria um novo usuario com os dados fornecidos
    const senhaHash = await hashPassword(senha);
    const r = await c.env.DB.prepare(
      'INSERT INTO usuario (nome, CPFCNPJ, email, senha) VALUES (?, ?, ?, ?)'
    ).bind(nome, cpf, email, senhaHash).run();
    usuario = { id: r.meta.last_row_id };
  }

  if (!usuario) {
    return c.json({ error: 'Usuário não encontrado. Forneça nome, email, cpf e senha para se cadastrar.' }, 400);
  }

  // Cria o agendamento (status = false = pendente)
  const r = await c.env.DB.prepare(
    'INSERT INTO agendamento (data_hora, telefone, status, usuario_id) VALUES (?, ?, 0, ?)'
  ).bind(dataHora, telefone, usuario.id).run();

  return c.json({ id: r.meta.last_row_id, message: 'Agendamento criado com sucesso' }, 201);
});

// ---------- Mensagem do cliente (requer login de cliente) ----------
pub.post('/mensagens', async (c) => {
  // Este endpoint será protegido por auth de cliente
  // Implementado no index.js com middleware de cliente
  return c.json({ error: 'Use o endpoint autenticado' }, 401);
});

export default pub;
