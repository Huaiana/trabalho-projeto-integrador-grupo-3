-- ============================================================
-- TechOcean — Schema D1 (SQLite) — espelha as entidades JPA
-- Execute: npx wrangler d1 execute techocean-db --remote --file=./schema.sql
-- ============================================================

-- Admin bootstrap lock (PK fixa, previne criação concorrente)
CREATE TABLE IF NOT EXISTS admin_bootstrap_lock (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin setup config (id fixo = 1)
CREATE TABLE IF NOT EXISTS admin_setup_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO admin_setup_config (id, enabled) VALUES (1, 1);

-- Usuario (staff base — FUNCIONARIO)
CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  CPFCNPJ TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

-- UsuarioAdmin (ADMIN / SUPERVISOR — cargo define o papel)
CREATE TABLE IF NOT EXISTS usuario_admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  cargo TEXT NOT NULL
);

-- Cliente
CREATE TABLE IF NOT EXISTS cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  CPFCNPJ TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

-- AuthSession (id = UUID string)
CREATE TABLE IF NOT EXISTS auth_session (
  id TEXT PRIMARY KEY,
  actor_id INTEGER NOT NULL,
  actor_name TEXT NOT NULL,
  role TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  logged_out_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_session_id ON auth_session(id);

-- AuditEvent
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
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_event(session_id);

-- PasswordResetToken (tokenHash, não token raw)
CREATE TABLE IF NOT EXISTS password_reset_token (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- Servico
CREATE TABLE IF NOT EXISTS servico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  disponivel INTEGER NOT NULL DEFAULT 1
);

-- Conteiner
CREATE TABLE IF NOT EXISTS conteiner (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_conteiner TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  situacao TEXT NOT NULL
);

-- Carga
CREATE TABLE IF NOT EXISTS carga (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  peso REAL NOT NULL,
  volume REAL NOT NULL,
  tipo_carga TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL
);

-- Solicitacao (cliente + carga + servico)
CREATE TABLE IF NOT EXISTS solicitacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  carga_id INTEGER NOT NULL,
  servico_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (carga_id) REFERENCES carga(id),
  FOREIGN KEY (servico_id) REFERENCES servico(id)
);

-- Operacao (OneToOne solicitacao, ManyToOne conteiner)
CREATE TABLE IF NOT EXISTS operacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao_id INTEGER NOT NULL UNIQUE,
  conteiner_id INTEGER,
  responsavel TEXT NOT NULL,
  andamento TEXT NOT NULL,
  observacoes TEXT NOT NULL,
  FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id),
  FOREIGN KEY (conteiner_id) REFERENCES conteiner(id)
);

-- Orcamento (cliente + carga + servico)
CREATE TABLE IF NOT EXISTS orcamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  carga_id INTEGER NOT NULL,
  servico_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  valor_estimado REAL,
  observacoes TEXT,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (carga_id) REFERENCES carga(id),
  FOREIGN KEY (servico_id) REFERENCES servico(id)
);

-- Agendamento (ManyToOne usuario, status boolean)
CREATE TABLE IF NOT EXISTS agendamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_hora TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  usuario_id INTEGER NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Mensagem (cliente → especialista)
CREATE TABLE IF NOT EXISTS mensagem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  especialista TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resposta TEXT,
  status TEXT NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

-- ContatoMensagem (formulário público, table: mensagem_contato)
CREATE TABLE IF NOT EXISTS mensagem_contato (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resposta TEXT,
  status TEXT NOT NULL DEFAULT 'ENVIADO',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- BackupRecord
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

-- Relatorio
CREATE TABLE IF NOT EXISTS relatorio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  link_documentos TEXT NOT NULL
);
