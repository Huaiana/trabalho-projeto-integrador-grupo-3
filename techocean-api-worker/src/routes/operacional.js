// ============================================================
// TechOcean — Rotas Operacionais (CRUD)
// ============================================================
import { Hono } from 'hono';
import { hashPassword } from '../auth.js';
import { authMiddleware, requireProfessional, blockFuncionarioDelete, audit } from '../middleware.js';

const op = new Hono();

// Todas as rotas operacionais requerem profissional autenticado
op.use('*', authMiddleware);
op.use('*', requireProfessional);
op.use('*', blockFuncionarioDelete);

// ============================================================
// CARGAS
// ============================================================
op.get('/api/cargas', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM carga ORDER BY id DESC').all();
  return c.json(r.results);
});

op.post('/api/cargas', async (c) => {
  const { descricao, peso, volume, tipoCarga, origem, destino } = await c.req.json();
  if (!descricao || peso == null || volume == null || !tipoCarga || !origem || !destino) {
    return c.json({ error: 'descricao, peso, volume, tipoCarga, origem, destino são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO carga (descricao, peso, volume, tipo_carga, origem, destino) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(descricao, peso, volume, tipoCarga, origem, destino).run();
  await audit(c, 'CARGA-001', `Carga criada: ${descricao}`, '/api/cargas', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Carga criada' }, 201);
});

op.put('/api/cargas/:id', async (c) => {
  const { descricao, peso, volume, tipoCarga, origem, destino } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE carga SET descricao = ?, peso = ?, volume = ?, tipo_carga = ?, origem = ?, destino = ? WHERE id = ?'
  ).bind(descricao, peso, volume, tipoCarga, origem, destino, c.req.param('id')).run();
  await audit(c, 'CARGA-002', `Carga atualizada: ${c.req.param('id')}`, '/api/cargas', c.req.param('id'));
  return c.json({ message: 'Carga atualizada' });
});

op.delete('/api/cargas/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM carga WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'CARGA-003', `Carga excluída: ${c.req.param('id')}`, '/api/cargas', c.req.param('id'));
  return c.json({ message: 'Carga excluída' });
});

// ============================================================
// CONTÊINERES
// ============================================================
op.get('/api/containers', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM conteiner ORDER BY id DESC').all();
  return c.json(r.results);
});

op.post('/api/containers', async (c) => {
  const { numeroConteiner, tipo, situacao } = await c.req.json();
  if (!numeroConteiner || !tipo || !situacao) {
    return c.json({ error: 'numeroConteiner, tipo, situacao são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO conteiner (numero_conteiner, tipo, situacao) VALUES (?, ?, ?)'
  ).bind(numeroConteiner, tipo, situacao).run();
  await audit(c, 'CONT-001', `Contêiner criado: ${numeroConteiner}`, '/api/containers', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Contêiner criado' }, 201);
});

op.put('/api/containers/:id', async (c) => {
  const { numeroConteiner, tipo, situacao } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE conteiner SET numero_conteiner = ?, tipo = ?, situacao = ? WHERE id = ?'
  ).bind(numeroConteiner, tipo, situacao, c.req.param('id')).run();
  await audit(c, 'CONT-002', `Contêiner atualizado: ${c.req.param('id')}`, '/api/containers', c.req.param('id'));
  return c.json({ message: 'Contêiner atualizado' });
});

op.delete('/api/containers/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM conteiner WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'CONT-003', `Contêiner excluído: ${c.req.param('id')}`, '/api/containers', c.req.param('id'));
  return c.json({ message: 'Contêiner excluído' });
});

// ============================================================
// SERVIÇOS
// ============================================================
op.get('/api/servicos', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM servico ORDER BY id DESC').all();
  return c.json(r.results);
});

op.post('/api/servicos', async (c) => {
  const { nome, descricao, categoria, disponivel } = await c.req.json();
  if (!nome || !descricao || !categoria) {
    return c.json({ error: 'nome, descricao, categoria são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO servico (nome, descricao, categoria, disponivel) VALUES (?, ?, ?, ?)'
  ).bind(nome, descricao, categoria, disponivel ? 1 : 0).run();
  await audit(c, 'SERV-001', `Serviço criado: ${nome}`, '/api/servicos', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Serviço criado' }, 201);
});

op.put('/api/servicos/:id', async (c) => {
  const { nome, descricao, categoria, disponivel } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE servico SET nome = ?, descricao = ?, categoria = ?, disponivel = ? WHERE id = ?'
  ).bind(nome, descricao, categoria, disponivel ? 1 : 0, c.req.param('id')).run();
  await audit(c, 'SERV-002', `Serviço atualizado: ${c.req.param('id')}`, '/api/servicos', c.req.param('id'));
  return c.json({ message: 'Serviço atualizado' });
});

op.delete('/api/servicos/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM servico WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'SERV-003', `Serviço excluído: ${c.req.param('id')}`, '/api/servicos', c.req.param('id'));
  return c.json({ message: 'Serviço excluído' });
});

// ============================================================
// SOLICITAÇÕES
// ============================================================
op.get('/api/solicitacoes', async (c) => {
  const r = await c.env.DB.prepare(`
    SELECT s.*, c.nome as cliente_nome, c.email as cliente_email,
           cg.descricao as carga_descricao, sv.nome as servico_nome
    FROM solicitacao s
    LEFT JOIN cliente c ON s.cliente_id = c.id
    LEFT JOIN carga cg ON s.carga_id = cg.id
    LEFT JOIN servico sv ON s.servico_id = sv.id
    ORDER BY s.id DESC
  `).all();
  return c.json(r.results);
});

op.post('/api/solicitacoes', async (c) => {
  const { cliente_id, carga_id, servico_id, status } = await c.req.json();
  if (!cliente_id || !carga_id || !servico_id) {
    return c.json({ error: 'cliente_id, carga_id, servico_id são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status) VALUES (?, ?, ?, ?)'
  ).bind(cliente_id, carga_id, servico_id, status || 'PENDENTE').run();
  await audit(c, 'SOLI-001', `Solicitação criada`, '/api/solicitacoes', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Solicitação criada' }, 201);
});

op.put('/api/solicitacoes/:id', async (c) => {
  const { cliente_id, carga_id, servico_id, status } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE solicitacao SET cliente_id = ?, carga_id = ?, servico_id = ?, status = ? WHERE id = ?'
  ).bind(cliente_id, carga_id, servico_id, status, c.req.param('id')).run();
  await audit(c, 'SOLI-002', `Solicitação atualizada: ${c.req.param('id')}`, '/api/solicitacoes', c.req.param('id'));
  return c.json({ message: 'Solicitação atualizada' });
});

op.delete('/api/solicitacoes/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM solicitacao WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'SOLI-003', `Solicitação excluída: ${c.req.param('id')}`, '/api/solicitacoes', c.req.param('id'));
  return c.json({ message: 'Solicitação excluída' });
});

// ============================================================
// OPERAÇÕES
// ============================================================
op.get('/api/operacoes', async (c) => {
  const r = await c.env.DB.prepare(`
    SELECT o.*, s.status as solicitacao_status, ct.numero_conteiner,
           c.nome as cliente_nome, sv.nome as servico_nome
    FROM operacao o
    LEFT JOIN solicitacao s ON o.solicitacao_id = s.id
    LEFT JOIN conteiner ct ON o.conteiner_id = ct.id
    LEFT JOIN cliente c ON s.cliente_id = c.id
    LEFT JOIN servico sv ON s.servico_id = sv.id
    ORDER BY o.id DESC
  `).all();
  return c.json(r.results);
});

op.post('/api/operacoes', async (c) => {
  const { solicitacao_id, conteiner_id, responsavel, andamento, observacoes } = await c.req.json();
  if (!solicitacao_id || !responsavel || !andamento || !observacoes) {
    return c.json({ error: 'solicitacao_id, responsavel, andamento, observacoes são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes) VALUES (?, ?, ?, ?, ?)'
  ).bind(solicitacao_id, conteiner_id || null, responsavel, andamento, observacoes).run();
  await audit(c, 'OPER-001', `Operação criada`, '/api/operacoes', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Operação criada' }, 201);
});

op.put('/api/operacoes/:id', async (c) => {
  const { solicitacao_id, conteiner_id, responsavel, andamento, observacoes } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE operacao SET solicitacao_id = ?, conteiner_id = ?, responsavel = ?, andamento = ?, observacoes = ? WHERE id = ?'
  ).bind(solicitacao_id, conteiner_id, responsavel, andamento, observacoes, c.req.param('id')).run();
  await audit(c, 'OPER-002', `Operação atualizada: ${c.req.param('id')}`, '/api/operacoes', c.req.param('id'));
  return c.json({ message: 'Operação atualizada' });
});

op.delete('/api/operacoes/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM operacao WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'OPER-003', `Operação excluída: ${c.req.param('id')}`, '/api/operacoes', c.req.param('id'));
  return c.json({ message: 'Operação excluída' });
});

// ============================================================
// ORÇAMENTOS
// ============================================================
op.get('/api/orcamentos', async (c) => {
  const r = await c.env.DB.prepare(`
    SELECT o.*, c.nome as cliente_nome, cg.descricao as carga_descricao, sv.nome as servico_nome
    FROM orcamento o
    LEFT JOIN cliente c ON o.cliente_id = c.id
    LEFT JOIN carga cg ON o.carga_id = cg.id
    LEFT JOIN servico sv ON o.servico_id = sv.id
    ORDER BY o.id DESC
  `).all();
  return c.json(r.results);
});

op.post('/api/orcamentos', async (c) => {
  const { cliente_id, carga_id, servico_id, status, valorEstimado, observacoes } = await c.req.json();
  if (!cliente_id || !carga_id || !servico_id) {
    return c.json({ error: 'cliente_id, carga_id, servico_id são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(cliente_id, carga_id, servico_id, status || 'PENDENTE', valorEstimado || null, observacoes || null).run();
  await audit(c, 'ORCA-001', `Orçamento criado`, '/api/orcamentos', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Orçamento criado' }, 201);
});

op.put('/api/orcamentos/:id', async (c) => {
  const { cliente_id, carga_id, servico_id, status, valorEstimado, observacoes } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE orcamento SET cliente_id = ?, carga_id = ?, servico_id = ?, status = ?, valor_estimado = ?, observacoes = ? WHERE id = ?'
  ).bind(cliente_id, carga_id, servico_id, status, valorEstimado, observacoes, c.req.param('id')).run();
  await audit(c, 'ORCA-002', `Orçamento atualizado: ${c.req.param('id')}`, '/api/orcamentos', c.req.param('id'));
  return c.json({ message: 'Orçamento atualizado' });
});

op.delete('/api/orcamentos/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM orcamento WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'ORCA-003', `Orçamento excluído: ${c.req.param('id')}`, '/api/orcamentos', c.req.param('id'));
  return c.json({ message: 'Orçamento excluído' });
});

// ============================================================
// CLIENTES (gestão interna)
// ============================================================
op.get('/api/clientes', async (c) => {
  const r = await c.env.DB.prepare('SELECT id, nome, CPFCNPJ, telefone, email FROM cliente ORDER BY id DESC').all();
  return c.json(r.results);
});

op.put('/api/clientes/:id', async (c) => {
  const { nome, CPFCNPJ, telefone, email, senha } = await c.req.json();
  if (senha) {
    const senhaHash = await hashPassword(senha);
    await c.env.DB.prepare(
      'UPDATE cliente SET nome = ?, CPFCNPJ = ?, telefone = ?, email = ?, senha = ? WHERE id = ?'
    ).bind(nome, CPFCNPJ, telefone, email, senhaHash, c.req.param('id')).run();
  } else {
    await c.env.DB.prepare(
      'UPDATE cliente SET nome = ?, CPFCNPJ = ?, telefone = ?, email = ? WHERE id = ?'
    ).bind(nome, CPFCNPJ, telefone, email, c.req.param('id')).run();
  }
  await audit(c, 'CLI-002', `Cliente atualizado: ${c.req.param('id')}`, '/api/clientes', c.req.param('id'));
  return c.json({ message: 'Cliente atualizado' });
});

op.delete('/api/clientes/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM cliente WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'CLI-003', `Cliente excluído: ${c.req.param('id')}`, '/api/clientes', c.req.param('id'));
  return c.json({ message: 'Cliente excluído' });
});

// ============================================================
// MENSAGENS (cliente → especialista)
// ============================================================
op.get('/api/mensagens', async (c) => {
  const r = await c.env.DB.prepare(`
    SELECT m.*, c.nome as cliente_nome, c.email as cliente_email
    FROM mensagem m
    LEFT JOIN cliente c ON m.cliente_id = c.id
    ORDER BY m.id DESC
  `).all();
  return c.json(r.results);
});

op.put('/api/mensagens/:id', async (c) => {
  const { resposta, status } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE mensagem SET resposta = ?, status = ? WHERE id = ?'
  ).bind(resposta, status, c.req.param('id')).run();
  await audit(c, 'MSG-002', `Mensagem respondida: ${c.req.param('id')}`, '/api/mensagens', c.req.param('id'));
  return c.json({ message: 'Mensagem atualizada' });
});

op.delete('/api/mensagens/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM mensagem WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'MSG-003', `Mensagem excluída: ${c.req.param('id')}`, '/api/mensagens', c.req.param('id'));
  return c.json({ message: 'Mensagem excluída' });
});

// ============================================================
// AGENDAMENTOS (gestão interna)
// ============================================================
op.get('/api/agendamentos', async (c) => {
  const r = await c.env.DB.prepare(`
    SELECT a.*, u.nome as usuario_nome, u.email as usuario_email
    FROM agendamento a
    LEFT JOIN usuario u ON a.usuario_id = u.id
    ORDER BY a.id DESC
  `).all();
  return c.json(r.results);
});

op.put('/api/agendamentos/:id', async (c) => {
  const { dataHora, telefone, status } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE agendamento SET data_hora = ?, telefone = ?, status = ? WHERE id = ?'
  ).bind(dataHora, telefone, status ? 1 : 0, c.req.param('id')).run();
  await audit(c, 'AGEN-002', `Agendamento atualizado: ${c.req.param('id')}`, '/api/agendamentos', c.req.param('id'));
  return c.json({ message: 'Agendamento atualizado' });
});

op.delete('/api/agendamentos/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM agendamento WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'AGEN-003', `Agendamento excluído: ${c.req.param('id')}`, '/api/agendamentos', c.req.param('id'));
  return c.json({ message: 'Agendamento excluído' });
});

// ============================================================
// RELATÓRIOS
// ============================================================
op.get('/api/relatorios', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM relatorio ORDER BY id DESC').all();
  return c.json(r.results);
});

op.post('/api/relatorios', async (c) => {
  const { nome, link_documentos } = await c.req.json();
  if (!nome || !link_documentos) {
    return c.json({ error: 'nome e link_documentos são obrigatórios' }, 400);
  }
  const r = await c.env.DB.prepare(
    'INSERT INTO relatorio (nome, link_documentos) VALUES (?, ?)'
  ).bind(nome, link_documentos).run();
  await audit(c, 'REL-001', `Relatório criado: ${nome}`, '/api/relatorios', r.meta.last_row_id);
  return c.json({ id: r.meta.last_row_id, message: 'Relatório criado' }, 201);
});

op.delete('/api/relatorios/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM relatorio WHERE id = ?').bind(c.req.param('id')).run();
  await audit(c, 'REL-003', `Relatório excluído: ${c.req.param('id')}`, '/api/relatorios', c.req.param('id'));
  return c.json({ message: 'Relatório excluído' });
});

// ============================================================
// BACKUP
// ============================================================
op.get('/api/backup/operacional', async (c) => {
  const tables = ['cliente', 'carga', 'conteiner', 'solicitacao', 'operacao', 'orcamento', 'servico', 'agendamento', 'mensagem', 'mensagem_contato'];
  const data = {};
  for (const t of tables) {
    const r = await c.env.DB.prepare(`SELECT * FROM ${t}`).all();
    data[t] = r.results;
  }
  await audit(c, 'BKP-001', 'Backup operacional gerado', '/api/backup/operacional');
  return c.json({ backup: data, generated_at: new Date().toISOString() });
});

op.get('/api/backup/historico', async (c) => {
  const r = await c.env.DB.prepare('SELECT * FROM backup_record ORDER BY created_at DESC').all();
  return c.json(r.results);
});

op.post('/api/backup/operacional', async (c) => {
  const user = c.get('user');
  const counts = {};
  for (const t of ['cliente', 'orcamento', 'solicitacao', 'operacao', 'mensagem_contato', 'usuario_admin']) {
    const r = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).first();
    counts[t] = r?.cnt || 0;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const backupCode = `BKP-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 8)}`;
  await c.env.DB.prepare(
    'INSERT INTO backup_record (backup_code, type, actor_id, actor_name, actor_role, clientes, orcamentos, solicitacoes, operacoes, mensagens, administradores, total_registros) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(backupCode, 'OPERACIONAL', user.sub, user.nome, user.role,
    counts.cliente, counts.orcamento, counts.solicitacao, counts.operacao, counts.mensagem_contato, counts.usuario_admin, total).run();
  await audit(c, 'BKP-002', `Backup operacional registrado: ${backupCode}`, '/api/backup/operacional');
  return c.json({ backupCode, totalRegistros: total });
});

export default op;
