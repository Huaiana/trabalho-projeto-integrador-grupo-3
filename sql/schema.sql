PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. ESTRUTURA DAS TABELAS (DDL UNIFICADO — D1 / SQLITE / JPA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_bootstrap_lock (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_setup_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);
INSERT OR IGNORE INTO admin_setup_config (id, enabled) VALUES (1, 1);

CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  CPFCNPJ TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  cargo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  CPFCNPJ TEXT NOT NULL UNIQUE,
  telefone TEXT,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_session (
  id TEXT PRIMARY KEY,
  actor_id INTEGER NOT NULL,
  actor_name TEXT NOT NULL,
  role TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  logged_out_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  session_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  event_code TEXT,
  action_code TEXT,
  action_description TEXT,
  action TEXT NOT NULL,
  method TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  occurred_at TEXT NOT NULL,
  response_status INTEGER,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS password_reset_token (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS servico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  disponivel INTEGER NOT NULL DEFAULT 1 CHECK (disponivel IN (0, 1))
);

CREATE TABLE IF NOT EXISTS conteiner (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_conteiner TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  situacao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS carga (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  peso REAL NOT NULL CHECK (peso > 0),
  volume REAL NOT NULL CHECK (volume > 0),
  tipo_carga TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solicitacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  carga_id INTEGER NOT NULL,
  servico_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'CONFIRMADO', 'CONCLUÍDO', 'CANCELADO')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (carga_id) REFERENCES carga(id) ON DELETE RESTRICT,
  FOREIGN KEY (servico_id) REFERENCES servico(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS operacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL UNIQUE,
  conteiner_id INTEGER,
  responsavel TEXT NOT NULL,
  andamento TEXT NOT NULL,
  observacoes TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id) ON DELETE CASCADE,
  FOREIGN KEY (conteiner_id) REFERENCES conteiner(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orcamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  carga_id INTEGER NOT NULL,
  servico_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'EM_ANALISE'
    CHECK (status IN ('EM_ANALISE', 'APROVADO', 'REJEITADO', 'EXPIRADO')),
  valor_estimado REAL NOT NULL CHECK (valor_estimado >= 0),
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (carga_id) REFERENCES carga(id) ON DELETE RESTRICT,
  FOREIGN KEY (servico_id) REFERENCES servico(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS agendamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_hora TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
  usuario_id INTEGER NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS mensagem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  especialista TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resposta TEXT,
  status TEXT NOT NULL DEFAULT 'ENVIADO'
    CHECK (status IN ('ENVIADO', 'EM_ATENDIMENTO', 'RESPONDIDO', 'FECHADO')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensagem_contato (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resposta TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE', 'ENVIADO', 'RESPONDIDO', 'ARQUIVADO')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS backup_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_code TEXT NOT NULL,
  type TEXT NOT NULL,
  actor_id INTEGER,
  actor_name TEXT,
  actor_role TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  clientes INTEGER DEFAULT 0,
  orcamentos INTEGER DEFAULT 0,
  solicitacoes INTEGER DEFAULT 0,
  operacoes INTEGER DEFAULT 0,
  mensagens INTEGER DEFAULT 0,
  administradores INTEGER DEFAULT 0,
  total_registros INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS relatorio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  link_documentos TEXT NOT NULL,
  gerado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referencia_compartilhada (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('SRV', 'CRG', 'CTR', 'OPR', 'ORC')),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  valor REAL CHECK (valor >= 0),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solicitacao_detalhe_compartilhado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL,
  nome_servico TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  servico_referencia_id INTEGER,
  carga_referencia_id INTEGER,
  conteiner_referencia_id INTEGER,
  operacao_referencia_id INTEGER,
  orcamento_referencia_id INTEGER,
  valor REAL NOT NULL DEFAULT 0 CHECK (valor >= 0),
  prestador_id INTEGER,
  prestador_nome TEXT,
  prestador_cargo TEXT,
  status_solicitacao TEXT NOT NULL DEFAULT 'SIM' CHECK (status_solicitacao IN ('SIM', 'NAO')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id) ON DELETE CASCADE,
  FOREIGN KEY (servico_referencia_id) REFERENCES referencia_compartilhada(id) ON DELETE SET NULL,
  FOREIGN KEY (carga_referencia_id) REFERENCES referencia_compartilhada(id) ON DELETE SET NULL,
  FOREIGN KEY (conteiner_referencia_id) REFERENCES referencia_compartilhada(id) ON DELETE SET NULL,
  FOREIGN KEY (operacao_referencia_id) REFERENCES referencia_compartilhada(id) ON DELETE SET NULL,
  FOREIGN KEY (orcamento_referencia_id) REFERENCES referencia_compartilhada(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_auth_session_id ON auth_session(id);
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_event(session_id);
CREATE INDEX IF NOT EXISTS idx_solicitacao_cliente ON solicitacao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitacao_status ON solicitacao(status);
CREATE INDEX IF NOT EXISTS idx_operacao_solicitacao ON operacao(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_operacao_conteiner ON operacao(conteiner_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_cliente ON orcamento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mensagem_cliente ON mensagem(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ref_comp_tipo ON referencia_compartilhada(tipo);
CREATE INDEX IF NOT EXISTS idx_detalhe_comp_solicitacao ON solicitacao_detalhe_compartilhado(solicitacao_id);

-- ============================================================================
-- 3. CARGA DE DADOS (SEED)
-- ============================================================================

INSERT INTO usuario (nome, CPFCNPJ, email, senha)
SELECT 'Operador Padrão TechOcean', '000.000.000-00', 'operador@techocean.com.br', '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'operador@techocean.com.br');

INSERT INTO usuario_admin (nome, email, senha, cargo)
SELECT 'Administrador TechOcean', 'admin@techocean.com.br', '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuario_admin WHERE email = 'admin@techocean.com.br');

INSERT INTO cliente (nome, CPFCNPJ, telefone, email, senha)
SELECT 'Gabriela Silva', '100.200.300-40', '(13) 9 9700-1212', 'gabi.12@gmail.com', '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000'
WHERE NOT EXISTS (SELECT 1 FROM cliente WHERE email = 'gabi.12@gmail.com');

INSERT OR IGNORE INTO cliente (nome, CPFCNPJ, telefone, email, senha) VALUES
('Marina Oliveira Costa', '412.876.930-15', '(13) 9 9123-4478', 'marina.costa@techlog.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000')),
('João Pedro Almeida', '318.442.760-90', '(11) 9 8877-2210', 'joao.almeida@transbrlog.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000')),
('Construtora Vale Norte Ltda', '27.884.115/0001-62', '(13) 3 2211-8890', 'compras@valenorte.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000')),
('Ana Beatriz Ferreira', '509.771.238-04', '(21) 9 9655-1188', 'ana.ferreira@oceanfreight.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000')),
('AgroExport Sul S.A.', '14.392.801/0001-45', '(41) 3 3440-9912', 'logistica@agroexportsul.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000')),
('BioFarma Brasil Ltda', '33.619.402/0001-88', '(11) 9 9412-6630', 'comex@biofarmabr.com.br', COALESCE((SELECT senha FROM cliente WHERE id = 1), '$2a$10$TechOceanSeedDefaultHash0000000000000000000000000'));

INSERT INTO carga (descricao, peso, volume, tipo_carga, origem, destino) VALUES
('Lote de eletrônicos embalados em pallets', 18500, 68, 'eletrônicos', 'Santos-SP, Brasil', 'Rotterdam, Países Baixos'),
('Caixas de tecido acondicionadas em pallets', 320, 4.5, 'tecidos', 'Brasil', 'Valência, Espanha'),
('Peças automotivas em racks metálicos', 4200, 32, 'autopeças', 'São Bernardo do Campo-SP, Brasil', 'Buenos Aires, Argentina'),
('Bobinas de aço laminado', 24000, 45, 'siderúrgico', 'Volta Redonda-RJ, Brasil', 'Xangai, China'),
('Máquinas agrícolas desmontadas', 9800, 120, 'maquinário', 'Paranaguá-PR, Brasil', 'Lagos, Nigéria'),
('Carregamento de café especial em sacas', 21600, 58, 'agronegócio', 'Varginha-MG, Brasil', 'Hamburgo, Alemanha'),
('Insumos farmacêuticos termolábeis', 6400, 28, 'farmacêutico', 'Campinas-SP, Brasil', 'Miami, Estados Unidos');

INSERT OR IGNORE INTO servico (nome, descricao, categoria, disponivel) VALUES
('Transporte marítimo conteinerizado — Exportação', 'SRV-000004 — Frete porta a porta, Dry Box 40'', THC e seguro.', 'Logística portuária', 1),
('Transporte marítimo LCL — Exportação', 'SRV-000005 — Consolidação LCL com coleta e desembaraço.', 'Logística portuária', 1),
('Transporte rodoviário internacional — Mercosul', 'SRV-000006 — Frete rodoviário com escolta e desembaraço.', 'Logística terrestre', 1),
('Transporte marítimo break-bulk', 'SRV-000007 — Carga solta/projeto com estivagem e amarração.', 'Logística portuária', 1),
('Armazenagem alfandegada', 'SRV-000008 — Recinto alfandegado com controle de inventário.', 'Armazenagem', 1),
('Transporte marítimo refrigerado — Reefer', 'SRV-000009 — Cadeia fria monitorada 24/7 com controle de umidade e temperatura.', 'Logística portuária', 1);

INSERT OR IGNORE INTO conteiner (numero_conteiner, tipo, situacao) VALUES
('MSCU7742119', 'Dry Box 40''', 'Em trânsito — navio MSC Aurora'),
('MSCU1180342', 'Dry Box 20''', 'Reservado — aguardando embarque'),
('TGHU9034772', 'Reefer 40''', 'Em trânsito — navio Maersk Sealand'),
('CMAU5518304', 'Open Top 20''', 'Aguardando carregamento'),
('HLXU6620148', 'Flat Rack 40''', 'Entregue — liberado no destino'),
('SUDU8841290', 'Dry Box 40'' HC', 'Em estufagem no terminal — Santos');

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'CONFIRMADO'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'marina.costa@techlog.com.br'
  AND cg.descricao = 'Lote de eletrônicos embalados em pallets'
  AND sv.nome = 'Transporte marítimo conteinerizado — Exportação';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'PENDENTE'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'gabi.12@gmail.com'
  AND cg.descricao = 'Caixas de tecido acondicionadas em pallets'
  AND sv.nome = 'Transporte marítimo LCL — Exportação';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'CONFIRMADO'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'joao.almeida@transbrlog.com.br'
  AND cg.descricao = 'Peças automotivas em racks metálicos'
  AND sv.nome = 'Transporte rodoviário internacional — Mercosul';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'EM_ANALISE'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'compras@valenorte.com.br'
  AND cg.descricao = 'Bobinas de aço laminado'
  AND sv.nome = 'Transporte marítimo break-bulk';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'CONCLUÍDO'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'ana.ferreira@oceanfreight.com.br'
  AND cg.descricao = 'Máquinas agrícolas desmontadas'
  AND sv.nome = 'Transporte marítimo break-bulk';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'CONFIRMADO'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'logistica@agroexportsul.com.br'
  AND cg.descricao = 'Carregamento de café especial em sacas'
  AND sv.nome = 'Transporte marítimo conteinerizado — Exportação';

INSERT INTO solicitacao (cliente_id, carga_id, servico_id, status)
SELECT c.id, cg.id, sv.id, 'CONFIRMADO'
FROM cliente c, carga cg, servico sv
WHERE c.email = 'comex@biofarmabr.com.br'
  AND cg.descricao = 'Insumos farmacêuticos termolábeis'
  AND sv.nome = 'Transporte marítimo refrigerado — Reefer';

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, ct.id, 'Rafael Menezes — Supervisor de Operações', 'Em trânsito internacional', 'Lacrado em Santos 18/11/2026. BL e invoice validados. ETA Rotterdam 12/12/2026.'
FROM solicitacao s, conteiner ct
WHERE ct.numero_conteiner = 'MSCU7742119'
  AND s.cliente_id = (SELECT id FROM cliente WHERE email = 'marina.costa@techlog.com.br');

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, ct.id, 'Fernando Cleiton — Supervisor de Operações', 'Aguardando embarque', 'Reservado no pátio. Embarque previsto 03/12/2026.'
FROM solicitacao s, conteiner ct
WHERE ct.numero_conteiner = 'MSCU1180342'
  AND s.cliente_id = (SELECT id FROM cliente WHERE email = 'gabi.12@gmail.com');

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, NULL, 'Rafael Menezes — Supervisor de Operações', 'Em trânsito rodoviário', 'Rastreamento ativo. Chegada a Buenos Aires 29/11/2026.'
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'joao.almeida@transbrlog.com.br');

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, ct.id, 'Kennedy Ribeiro — Supervisor de Operações', 'Entregue', 'Entregue em Lagos 14/11/2026. Comprovante assinado.'
FROM solicitacao s, conteiner ct
WHERE ct.numero_conteiner = 'HLXU6620148'
  AND s.cliente_id = (SELECT id FROM cliente WHERE email = 'ana.ferreira@oceanfreight.com.br');

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, ct.id, 'Fernando Cleiton — Supervisor de Operações', 'Em preparação no terminal', 'Estufagem e certificação fitossanitária concluídas em Santos. Cut-off 28/11/2026.'
FROM solicitacao s, conteiner ct
WHERE ct.numero_conteiner = 'SUDU8841290'
  AND s.cliente_id = (SELECT id FROM cliente WHERE email = 'logistica@agroexportsul.com.br');

INSERT INTO operacao (solicitacao_id, conteiner_id, responsavel, andamento, observacoes)
SELECT s.id, ct.id, 'Kennedy Ribeiro — Supervisor de Operações', 'Em trânsito refrigerado', 'Set-point ajustado em +4°C. Telemetria ativa. ETA Miami 05/12/2026.'
FROM solicitacao s, conteiner ct
WHERE ct.numero_conteiner = 'TGHU9034772'
  AND s.cliente_id = (SELECT id FROM cliente WHERE email = 'comex@biofarmabr.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'APROVADO', 48750.90, 'Frete marítimo + THC + seguro. Aprovado 20/11/2026.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'marina.costa@techlog.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'EM_ANALISE', 6250.00, 'Aguardando peso cubado e consolidação.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'gabi.12@gmail.com');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'APROVADO', 18400.00, 'Frete rodoviário + escolta + seguro.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'joao.almeida@transbrlog.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'EM_ANALISE', 132900.00, 'Aguardando laudo de estivagem e seguro.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'compras@valenorte.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'APROVADO', 98750.00, 'Frete break-bulk + amarração + seguro.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'ana.ferreira@oceanfreight.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'APROVADO', 34200.00, 'Frete marítimo Dry Box 40'' HC + despacho aduaneiro.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'logistica@agroexportsul.com.br');

INSERT INTO orcamento (cliente_id, carga_id, servico_id, status, valor_estimado, observacoes)
SELECT s.cliente_id, s.carga_id, s.servico_id, 'APROVADO', 64800.50, 'Frete Reefer 40'' + monitoramento térmico + seguro internacional.'
FROM solicitacao s WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'comex@biofarmabr.com.br');

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Rafael Menezes', 'Confirmar prazo de entrega do MSCU7742119 em Rotterdam.', 'ETA 12/12/2026. Aviso de chegada será enviado.', 'RESPONDIDO'
FROM cliente WHERE email = 'marina.costa@techlog.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Kennedy Flávio', 'Preciso do BL original para o desembaraço.', NULL, 'ENVIADO'
FROM cliente WHERE email = 'marina.costa@techlog.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Fernando Cleiton', 'Enviei as medidas das caixas. Confirma o frete LCL?', NULL, 'ENVIADO'
FROM cliente WHERE email = 'gabi.12@gmail.com';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Rafael Menezes', 'Qual a previsão de chegada das peças em Buenos Aires?', NULL, 'ENVIADO'
FROM cliente WHERE email = 'joao.almeida@transbrlog.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Kennedy Ribeiro', 'Precisamos do laudo de estivagem das bobinas.', 'Solicitado ao terminal, retorno em 48h.', 'RESPONDIDO'
FROM cliente WHERE email = 'compras@valenorte.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Kennedy Flávio', 'Recebemos o comprovante de entrega em Lagos. Obrigada!', 'Foi um prazer, Ana!', 'RESPONDIDO'
FROM cliente WHERE email = 'ana.ferreira@oceanfreight.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Fernando Cleiton', 'Certificado fitossanitário já foi anexado ao processo do SUDU8841290?', 'Sim, validado junto ao MAPA e liberado para embarque.', 'RESPONDIDO'
FROM cliente WHERE email = 'logistica@agroexportsul.com.br';

INSERT INTO mensagem (cliente_id, especialista, conteudo, resposta, status)
SELECT id, 'Kennedy Ribeiro', 'Solicito relatório parcial do data logger de temperatura do TGHU9034772.', NULL, 'ENVIADO'
FROM cliente WHERE email = 'comex@biofarmabr.com.br';

INSERT INTO mensagem_contato (nome, email, conteudo, resposta, status) VALUES
('Marina Oliveira Costa', 'marina.costa@techlog.com.br', 'Cotação para embarque em janeiro/2027, Santos → Rotterdam.', 'Enviada em 24/11/2026, validade 15 dias.', 'RESPONDIDO'),
('João Pedro Almeida', 'joao.almeida@transbrlog.com.br', 'Cotar transporte rodoviário para 6 carretas mensais.', 'Proposta enviada em 24/11/2026.', 'RESPONDIDO'),
('Construtora Vale Norte Ltda', 'compras@valenorte.com.br', 'Armazenagem alfandegada para 40 t de aço.', 'Contato agendado para 26/11/2026.', 'RESPONDIDO'),
('AgroExport Sul S.A.', 'logistica@agroexportsul.com.br', 'Contrato semestral para 12 contêineres mensais destino Europa.', 'Reunião comercial marcada para 30/11/2026.', 'RESPONDIDO'),
('Ricardo Mendes — Metalúrgica Atlas', 'ricardo.mendes@atlasmetal.com.br', 'Gostaria de informações sobre desembaraço aduaneiro em Santos.', NULL, 'PENDENTE');

INSERT INTO agendamento (data_hora, telefone, status, usuario_id)
SELECT '2026-12-05 14:30:00', '(13) 9 9123-4478', 0, id FROM usuario WHERE email = 'operador@techocean.com.br';

INSERT INTO agendamento (data_hora, telefone, status, usuario_id)
SELECT '2026-11-27 10:00:00', '(11) 9 8877-2210', 0, id FROM usuario WHERE email = 'operador@techocean.com.br';

INSERT INTO agendamento (data_hora, telefone, status, usuario_id)
SELECT '2026-11-28 15:30:00', '(21) 9 9655-1188', 0, id FROM usuario WHERE email = 'operador@techocean.com.br';

INSERT INTO agendamento (data_hora, telefone, status, usuario_id)
SELECT '2026-11-30 09:30:00', '(41) 3 3440-9912', 1, id FROM usuario WHERE email = 'operador@techocean.com.br';

INSERT INTO agendamento (data_hora, telefone, status, usuario_id)
SELECT '2026-12-02 16:00:00', '(11) 9 9412-6630', 0, id FROM usuario WHERE email = 'operador@techocean.com.br';

INSERT INTO relatorio (nome, link_documentos) VALUES
('Relatório de operações — novembro/2026', 'https://techocean.pages.dev/relatorios/operacoes-2026-11'),
('Relatório de orçamentos aprovados — 4º tri/2026', 'https://techocean.pages.dev/relatorios/orcamentos-2026-q4'),
('Indicadores de desempenho portuário (KPIs) — 2026', 'https://techocean.pages.dev/relatorios/kpis-portuarios-2026'),
('Auditoria de cadeia fria e contêineres Reefer — nov/2026', 'https://techocean.pages.dev/relatorios/reefer-2026-11');

INSERT INTO referencia_compartilhada (tipo, nome, categoria, descricao, valor) VALUES
('SRV', 'Transporte marítimo conteinerizado — Exportação', 'Logística portuária', 'Frete porta a porta, Dry Box 40''.', 48750.90),
('SRV', 'Transporte marítimo break-bulk', 'Logística portuária', 'Carga solta/projeto com estivagem e amarração.', 98750.00),
('SRV', 'Transporte rodoviário internacional — Mercosul', 'Logística terrestre', 'Frete rodoviário com escolta e desembaraço.', 18400.00),
('SRV', 'Transporte marítimo refrigerado — Reefer', 'Logística portuária', 'Cadeia fria monitorada 24/7 com telemetria.', 64800.50),
('CRG', 'Lote de eletrônicos embalados em pallets', 'eletrônicos', '18.500 kg / 68 m³ — Santos → Rotterdam.', NULL),
('CRG', 'Máquinas agrícolas desmontadas', 'maquinário', '9.800 kg / 120 m³ — Paranaguá → Lagos.', NULL),
('CRG', 'Peças automotivas em racks metálicos', 'autopeças', '4.200 kg / 32 m³ — São Bernardo do Campo → Buenos Aires.', NULL),
('CRG', 'Carregamento de café especial em sacas', 'agronegócio', '21.600 kg / 58 m³ — Varginha → Hamburgo.', NULL),
('CRG', 'Insumos farmacêuticos termolábeis', 'farmacêutico', '6.400 kg / 28 m³ — Campinas → Miami.', NULL),
('CTR', 'MSCU7742119', 'Dry Box 40''', 'Lacrado, em trânsito no MSC Aurora.', NULL),
('CTR', 'HLXU6620148', 'Flat Rack 40''', 'Carga de projeto, entrega concluída.', NULL),
('CTR', 'SUDU8841290', 'Dry Box 40'' HC', 'Estufagem concluída no terminal de Santos.', NULL),
('CTR', 'TGHU9034772', 'Reefer 40''', 'Temperatura controlada +4°C, navio Maersk Sealand.', NULL),
('OPR', 'Operação de exportação Santos → Rotterdam', 'Operação portuária', 'Responsável: Rafael Menezes.', NULL),
('OPR', 'Operação break-bulk Paranaguá → Lagos', 'Operação portuária', 'Responsável: Kennedy Ribeiro.', NULL),
('OPR', 'Operação rodoviária SP → Buenos Aires', 'Operação terrestre', 'Responsável: Rafael Menezes.', NULL),
('OPR', 'Operação exportação café Santos → Hamburgo', 'Operação portuária', 'Responsável: Fernando Cleiton.', NULL),
('OPR', 'Operação cadeia fria Santos → Miami', 'Operação portuária', 'Responsável: Kennedy Ribeiro.', NULL),
('ORC', 'Orçamento aprovado — Marina Oliveira Costa', 'Comercial', 'Aprovado 20/11/2026.', 48750.90),
('ORC', 'Orçamento aprovado — Ana Beatriz Ferreira', 'Comercial', 'Aprovado 02/11/2026.', 98750.00),
('ORC', 'Orçamento aprovado — João Pedro Almeida', 'Comercial', 'Aprovado 19/11/2026.', 18400.00),
('ORC', 'Orçamento aprovado — AgroExport Sul S.A.', 'Comercial', 'Aprovado 21/11/2026.', 34200.00),
('ORC', 'Orçamento aprovado — BioFarma Brasil Ltda', 'Comercial', 'Aprovado 22/11/2026.', 64800.50);

INSERT INTO solicitacao_detalhe_compartilhado (
  solicitacao_id, nome_servico, categoria, descricao,
  servico_referencia_id, carga_referencia_id, conteiner_referencia_id, operacao_referencia_id, orcamento_referencia_id,
  valor, prestador_id, prestador_nome, prestador_cargo, status_solicitacao, criado_em
)
SELECT
  s.id,
  'Transporte marítimo conteinerizado — Exportação',
  'Logística portuária',
  'Exportação completa porta a porta Santos → Rotterdam.',
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'SRV' AND nome = 'Transporte marítimo conteinerizado — Exportação' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CRG' AND nome LIKE 'Lote de eletrônicos%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CTR' AND nome = 'MSCU7742119' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'OPR' AND nome LIKE 'Operação de exportação Santos%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'ORC' AND nome LIKE '%Marina Oliveira Costa%' ORDER BY id DESC LIMIT 1),
  48750.90, 3, 'Kennedy Flávio', 'SUPERVISOR', 'SIM', datetime('now')
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'marina.costa@techlog.com.br');

INSERT INTO solicitacao_detalhe_compartilhado (
  solicitacao_id, nome_servico, categoria, descricao,
  servico_referencia_id, carga_referencia_id, conteiner_referencia_id, operacao_referencia_id, orcamento_referencia_id,
  valor, prestador_id, prestador_nome, prestador_cargo, status_solicitacao, criado_em
)
SELECT
  s.id,
  'Transporte marítimo break-bulk',
  'Logística portuária',
  'Embarque break-bulk de carga projeto entregue em Lagos.',
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'SRV' AND nome = 'Transporte marítimo break-bulk' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CRG' AND nome LIKE 'Máquinas agrícolas%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CTR' AND nome = 'HLXU6620148' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'OPR' AND nome LIKE 'Operação break-bulk%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'ORC' AND nome LIKE '%Ana Beatriz Ferreira%' ORDER BY id DESC LIMIT 1),
  98750.00, 2, 'Kennedy Ribeiro', 'ADMIN', 'SIM', datetime('now')
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'ana.ferreira@oceanfreight.com.br');

INSERT INTO solicitacao_detalhe_compartilhado (
  solicitacao_id, nome_servico, categoria, descricao,
  servico_referencia_id, carga_referencia_id, conteiner_referencia_id, operacao_referencia_id, orcamento_referencia_id,
  valor, prestador_id, prestador_nome, prestador_cargo, status_solicitacao, criado_em
)
SELECT
  s.id,
  'Transporte rodoviário internacional — Mercosul',
  'Logística terrestre',
  'Frete rodoviário dedicado com escolta armada e desembaraço fronteiriço.',
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'SRV' AND nome = 'Transporte rodoviário internacional — Mercosul' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CRG' AND nome LIKE 'Peças automotivas%' ORDER BY id DESC LIMIT 1),
  NULL,
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'OPR' AND nome LIKE 'Operação rodoviária%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'ORC' AND nome LIKE '%João Pedro Almeida%' ORDER BY id DESC LIMIT 1),
  18400.00, 1, 'Rafael Menezes', 'SUPERVISOR', 'SIM', datetime('now')
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'joao.almeida@transbrlog.com.br');

INSERT INTO solicitacao_detalhe_compartilhado (
  solicitacao_id, nome_servico, categoria, descricao,
  servico_referencia_id, carga_referencia_id, conteiner_referencia_id, operacao_referencia_id, orcamento_referencia_id,
  valor, prestador_id, prestador_nome, prestador_cargo, status_solicitacao, criado_em
)
SELECT
  s.id,
  'Transporte marítimo conteinerizado — Exportação',
  'Logística portuária',
  'Exportação de café especial em contêiner Dry Box 40'' HC para Hamburgo.',
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'SRV' AND nome = 'Transporte marítimo conteinerizado — Exportação' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CRG' AND nome LIKE 'Carregamento de café%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CTR' AND nome = 'SUDU8841290' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'OPR' AND nome LIKE 'Operação exportação café%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'ORC' AND nome LIKE '%AgroExport Sul%' ORDER BY id DESC LIMIT 1),
  34200.00, 4, 'Fernando Cleiton', 'SUPERVISOR', 'SIM', datetime('now')
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'logistica@agroexportsul.com.br');

INSERT INTO solicitacao_detalhe_compartilhado (
  solicitacao_id, nome_servico, categoria, descricao,
  servico_referencia_id, carga_referencia_id, conteiner_referencia_id, operacao_referencia_id, orcamento_referencia_id,
  valor, prestador_id, prestador_nome, prestador_cargo, status_solicitacao, criado_em
)
SELECT
  s.id,
  'Transporte marítimo refrigerado — Reefer',
  'Logística portuária',
  'Transporte internacional refrigerado (+4°C) com telemetria contínua.',
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'SRV' AND nome = 'Transporte marítimo refrigerado — Reefer' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CRG' AND nome LIKE 'Insumos farmacêuticos%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'CTR' AND nome = 'TGHU9034772' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'OPR' AND nome LIKE 'Operação cadeia fria%' ORDER BY id DESC LIMIT 1),
  (SELECT id FROM referencia_compartilhada WHERE tipo = 'ORC' AND nome LIKE '%BioFarma Brasil%' ORDER BY id DESC LIMIT 1),
  64800.50, 2, 'Kennedy Ribeiro', 'ADMIN', 'SIM', datetime('now')
FROM solicitacao s
WHERE s.cliente_id = (SELECT id FROM cliente WHERE email = 'comex@biofarmabr.com.br');

-- ============================================================================
-- 4. VIEW CONSOLIDADA
-- ============================================================================

DROP VIEW IF EXISTS vw_solicitacoes_consolidadas;

CREATE VIEW vw_solicitacoes_consolidadas AS
SELECT
  s.id AS solicitacao_id,
  s.status AS status_solicitacao,
  s.criado_em AS solicitacao_criada_em,

  c.id AS cliente_id,
  c.nome AS cliente_nome,
  c.CPFCNPJ AS cliente_cpf_cnpj,
  c.telefone AS cliente_telefone,
  c.email AS cliente_email,

  cg.id AS carga_id,
  cg.descricao AS carga_descricao,
  cg.peso AS carga_peso_kg,
  cg.volume AS carga_volume_m3,
  cg.tipo_carga,
  cg.origem AS carga_origem,
  cg.destino AS carga_destino,

  sv.id AS servico_id,
  sv.nome AS servico_nome,
  sv.categoria AS servico_categoria,
  sv.disponivel AS servico_disponivel,

  op.id AS operacao_id,
  op.responsavel AS operacao_responsavel,
  op.andamento AS operacao_andamento,
  op.observacoes AS operacao_observacoes,
  op.atualizado_em AS operacao_atualizada_em,
  ct.id AS conteiner_id,
  ct.numero_conteiner,
  ct.tipo AS conteiner_tipo,
  ct.situacao AS conteiner_situacao,

  orc.id AS orcamento_id,
  orc.status AS orcamento_status,
  orc.valor_estimado AS orcamento_valor_estimado,
  orc.observacoes AS orcamento_observacoes,
  orc.criado_em AS orcamento_criado_em,

  sdc.id AS detalhe_compartilhado_id,
  sdc.nome_servico AS detalhe_nome_servico,
  sdc.categoria AS detalhe_categoria,
  sdc.descricao AS detalhe_descricao,
  sdc.valor AS detalhe_valor,
  sdc.prestador_id,
  sdc.prestador_nome,
  sdc.prestador_cargo,
  sdc.status_solicitacao AS detalhe_status_solicitacao,
  sdc.criado_em AS detalhe_criado_em,

  ref_srv.id AS ref_servico_id,
  ref_srv.nome AS ref_servico_
