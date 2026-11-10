# TechOcean API — Worker (Hono + D1)

Backend migrado de Java/Spring Boot (Render) para Cloudflare Worker com Hono e D1.

## Estrutura

```
techocean-api/
├── package.json
├── wrangler.jsonc
├── schema.sql              # Schema do banco D1 (SQLite)
└── src/
    ├── index.js            # App principal (Hono, CORS, rotas)
    ├── auth.js             # JWT, BCrypt, sessões, auditoria
    ├── middleware.js        # Auth middleware, RBAC, auditoria
    └── routes/
        ├── auth.js          # Login, logout, setup, password reset
        ├── admin.js         # Gestão de usuários, sessões, auditoria
        ├── operacional.js   # CRUD: cargas, containers, operações, etc.
        └── public.js        # Serviços (público), contato, agendamento, cadastro cliente
```

## Pré-requisitos

1. **Node.js** 18+
2. **Wrangler** CLI: `npm install -g wrangler` (ou use npx)

## Passos de deploy

### 1. Criar o banco D1 (pelo dashboard)

Acesse: https://dash.cloudflare.com/fa00c475606d88f46b3d60065706b803/workers/d1/create

Crie um banco chamado `techocean-db`. Copie o **Database ID** gerado.

### 2. Configurar o wrangler.jsonc

Substitua `COLOQUE_O_ID_DO_D1_AQUI` pelo ID do banco criado.

### 3. Instalar dependências

```bash
npm install
```

### 4. Criar as tabelas (migrar schema)

```bash
# Local (para testes)
npx wrangler d1 execute techocean-db --local --file=./schema.sql

# Remoto (produção)
npx wrangler d1 execute techocean-db --remote --file=./schema.sql
```

### 5. Configurar o secret do JWT

Gere uma string aleatória de pelo menos 32 bytes e defina como secret:

```bash
npx wrangler secret put APP_AUTH_SECRET
# Cole uma string aleatória longa, ex: openssl rand -base64 48
```

### 6. Deploy do Worker

```bash
npx wrangler deploy
```

O Worker será publicado em `https://techocean-api.<seu-subdominio>.workers.dev`.

### 7. Atualizar o frontend

No projeto Pages `techocean`, atualize a variável `VITE_API_URL` para apontar para o Worker:

```
VITE_API_URL=https://techocean-api.<seu-subdominio>.workers.dev
```

### 8. Criar o primeiro admin

Faça um POST para `/admin/setup`:

```bash
curl -X POST https://techocean-api.<seu-subdominio>.workers.dev/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"nome":"Admin","email":"admin@techocean.com","senha":"senhaSegura123"}'
```

## Endpoints

### Públicos (sem auth)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/servicos` | Lista serviços disponíveis |
| POST | `/admin/setup` | Criar primeiro admin |
| POST | `/admin/login` | Login profissional |
| POST | `/clientes` | Cadastro de cliente |
| POST | `/clientes/login` | Login cliente |
| POST | `/mensagens/contatos` | Formulário de contato |
| POST | `/agendamentos` | Criar agendamento (+ cadastro) |
| POST | `/auth/password-reset/request` | Solicitar reset de senha |
| POST | `/auth/password-reset/confirm` | Confirmar reset de senha |

### Profissionais (ADMIN, SUPERVISOR, FUNCIONARIO)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST/PUT/DELETE | `/api/cargas` | CRUD de cargas |
| GET/POST/PUT/DELETE | `/api/containers` | CRUD de contêineres |
| GET/POST/PUT/DELETE | `/api/servicos` | CRUD de serviços |
| GET/POST/PUT/DELETE | `/api/solicitacoes` | CRUD de solicitações |
| GET/POST/PUT/DELETE | `/api/operacoes` | CRUD de operações |
| GET/POST/PUT/DELETE | `/api/orcamentos` | CRUD de orçamentos |
| GET/PUT/DELETE | `/api/clientes` | Gestão de clientes |
| GET/PUT/DELETE | `/api/mensagens` | Gestão de mensagens |
| GET/PUT/DELETE | `/api/agendamentos` | Gestão de agendamentos |
| GET/POST/DELETE | `/api/relatorios` | CRUD de relatórios |
| GET/POST | `/api/backup/operacional` | Backup operacional |
| POST | `/auth/logout` | Logout |

> FUNCIONARIO não pode fazer DELETE.

### ADMIN apenas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/admin/usuarios` | Listar/criar profissionais |
| PUT/DELETE | `/admin/usuarios/:id` | Atualizar/excluir profissional |
| GET | `/admin/sessoes` | Listar sessões |
| GET | `/admin/sessoes/:id/auditoria` | Auditoria da sessão |
| POST | `/admin/sessoes/:id/encerrar` | Encerrar sessão |
| GET | `/admin/auditoria` | Listar eventos de auditoria |
| GET/PUT | `/admin/setup-config` | Config de setup |
| POST | `/api/backup/admin/completo` | Backup completo |
| GET | `/api/backup/historico` | Histórico de backups |

### Cliente (auth de cliente)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/cliente/mensagens` | Enviar mensagem |
| GET | `/api/cliente/mensagens` | Listar suas mensagens |

## Desenvolvimento local

```bash
npx wrangler dev
```

O Worker roda em `http://localhost:8788`.
