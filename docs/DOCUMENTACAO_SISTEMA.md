# TechOcean — Documentação do Sistema

## 1. Visão geral

Plataforma web para operações portuárias/logísticas: clientes solicitam serviços e orçamentos, e a equipe (administrador, supervisor, funcionário) gerencia cargas, contêineres, operações, agendamentos, mensagens, auditoria e backups.

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Backend | Spring Boot 3.5.16, Java 21, Spring Security (OAuth2 Resource Server/JWT), Spring Data JPA | Render (Docker) |
| Frontend | Vite + JavaScript puro (SPA) | Cloudflare Pages (`techocean`) |
| Banco | JPA/Hibernate (`ddl-auto=update` em produção) | Configurado por variáveis de ambiente |

URLs: frontend `https://techocean.pages.dev`; API `https://trabalho-projeto-integrador-grupo-3-1.onrender.com`.

## 2. Estrutura do repositório

```
demo/                      Backend (pom.xml na raiz; fontes em demo/src)
  src/main/java/com/git/techocean/
    config/                SecurityConfig, CorsConfig, SessionAuditInterceptor
    controller/            Endpoints REST
    model/                 Entidades JPA
    repository/            Spring Data repositories
    service/               Regras de negócio
web/techocean-web-main/    Frontend (src/main.js, src/api.js, testes, build Vite)
Dockerfile                 Build do backend no Render (contexto = raiz do repo)
docs/                      Documentação
```

## 3. Perfis e permissões

| Perfil | Acesso |
|---|---|
| ADMIN | Tudo, incluindo `/admin/**` (usuários, auditoria, sessões), backup completo |
| SUPERVISOR | Leitura/escrita operacional e exclusões |
| FUNCIONARIO | Leitura/escrita operacional (sem DELETE) |
| Público | Cadastro/login de cliente, lista de serviços, contato, agendamento, setup inicial, recuperação de senha, health |

Regras em `SecurityConfig`: ordem das regras do mais específico ao mais genérico; `anyRequest().denyAll()` como padrão negativo.

## 4. Módulos funcionais

- **Cargas, Contêineres, Operações, Serviços, Orçamentos, Solicitações, Agendamentos, Clientes, Mensagens/Contatos**: CRUD via controllers/services.
- **Primeiro acesso administrativo**: `/admin/setup` cria o primeiro admin; `AdminBootstrapLock` (chave primária fixa) garante que só um seja criado, mesmo com requisições concorrentes. Pode ser ativado/desativado (`AdminSetupConfig`).
- **Recuperação de senha**: `/auth/password-reset/request|confirm`, token de uso único com expiração (`PasswordResetToken`), envio por e-mail (`JavaMailSender` opcional; sem SMTP retorna 503).
- **Sessões**: cada login cria `AuthSession`; token JWT referencia a sessão; logout encerra. Aba "Sessões" lista início, última atividade, duração (segundos) e botão **Acessar** (ativa) / **Verificar** (encerrada), que abre as ações da sessão (`GET /admin/sessoes/{id}/auditoria`).
- **Auditoria**: `SessionAuditInterceptor` registra cada requisição autenticada em `AuditEvent` com: código único do evento (`EVT-yyyyMMdd-HHmmssSSS-XXXXXX`), código da ação (ex.: `AUTH-001`, `ADM-00x`, `BKP-001`, `AUD-001`, `CARGA-00x`, `SYS-999`), descrição, profissional, data/hora, sessão.
- **Backup**: `/api/backup/operacional` (todos os perfis), `/api/backup/admin/completo`, `/api/backup/historico`. Cada backup gera `BackupRecord` (código `BKP-yyyyMMdd-HHmmss-XXXXXX`, autor, data/hora, quantidade de registros). O histórico persiste no banco; os arquivos ficam em `./backups/` (efêmero no Render).
- **Frontend**: botão `← Painel` em todas as abas; token persistido em `localStorage` (`techocean.accessToken`) para manter login após novo deploy.

## 5. Modelo de segurança (implementado)

| Controle | Implementação |
|---|---|
| Autenticação | JWT HS256 assinado com `APP_AUTH_SECRET` (mín. 32 bytes; obrigatório no perfil `production`, a aplicação não sobe sem ele) |
| Senhas | BCrypt (`BCryptPasswordEncoder`) |
| Autorização | RBAC por `hasRole`/`hasAnyRole` no `SecurityFilterChain`; `/admin/**` só ADMIN; padrão `denyAll` |
| Sessão | API stateless; `AuthSession` validada a cada requisição (`AuthSessionService.touch`: sessão, usuário e perfil) |
| CSRF | Desabilitado — aceitável porque a API usa Bearer token no header, sem cookies de sessão |
| CORS | `CorsConfig` com origens permitidas explícitas (frontend Cloudflare) |
| Recuperação de senha | Token de uso único, expiração, resposta sem revelar se o e-mail existe |
| Primeiro admin | Trava no banco contra criação concorrente |
| Auditoria | Toda ação registrada com autor, sessão, data/hora e código único |
| Segredos | Via variáveis de ambiente (Render); `.env` do frontend contém apenas a URL pública da API |
| Transporte | HTTPS fornecido por Render e Cloudflare |
| JPA | `open-in-view=false`; consultas por repositórios (parametrizadas), sem SQL concatenado |

## 6. Varredura de vulnerabilidades

Data: 2026-11-04. Escopo: backend (config, controllers, services, entidades, Dockerfile) e frontend (`main.js`, `api.js`). Método: revisão estática de código.

### Resultado da varredura automatizada

| # | Severidade | Arquivo | Vulnerabilidade | Confiança |
|---|---|---|---|---|
| 1 | MÉDIA | `service/PasswordResetService.java` (94-104) | Redefinir a senha não encerra as sessões ativas; um JWT roubado continua válido até expirar (até 12 h) | 9/10 |

**Correção recomendada:** na mesma transação de `confirmReset`, marcar como encerradas todas as sessões ativas do usuário (mesmo padrão usado ao alterar credenciais pela administração).

### Pontos de atenção adicionais (identificados durante a documentação)

| # | Severidade | Local | Observação | Recomendação |
|---|---|---|---|---|
| 2 | MÉDIA | `SecurityConfig` — `/api/backup/admin/completo` | O backup completo só é ocultado no frontend; no backend cai na regra genérica (ADMIN, SUPERVISOR, FUNCIONARIO) | Adicionar `.requestMatchers("/api/backup/admin/**").hasRole("ADMIN")` antes das regras genéricas |
| 3 | BAIXA | `SecurityConfig` — `/api/backup/historico` | Acessível a todos os perfis da equipe, expõe autor e quantidade de dados | Restringir a ADMIN/SUPERVISOR se necessário |
| 4 | BAIXA | `frontend api.js` | Token em `localStorage` fica exposto se houver XSS | Manter escape de todo conteúdo dinâmico inserido via `innerHTML`; considerar CSP no Cloudflare (`_headers`) |
| 5 | BAIXA | Endpoints públicos (`/clientes/login`, `/admin/login`, `/auth/password-reset/*`, `/mensagens/contatos`) | Sem limitação de tentativas (rate limit) — risco de força bruta/spam | Adicionar rate limiting (ex.: Bucket4j ou regras no Cloudflare/WAF) |
| 6 | BAIXA | Backups em arquivo | O conteúdo usa `toString()` das entidades (não é JSON) e fica em disco efêmero; dados sensíveis em texto | Exportar JSON, excluir campos de senha/hash, armazenar em storage externo criptografado |
| 7 | BAIXA | JWT HS256 | Chave simétrica única; vazamento permite forjar tokens | Rotacionar `APP_AUTH_SECRET` periodicamente; segredo longo e aleatório |
| 8 | INFO | `ddl-auto=update` | Evolução de esquema automática em produção | Adotar Flyway/Liquibase |

### Itens verificados sem falha encontrada

Injeção SQL (JPA parametrizado), exposição de senhas em respostas, controle de acesso a `/admin/**`, bypass de autenticação em rotas públicas, segredo JWT padrão em produção (bloqueado), criação concorrente do primeiro administrador.

## 7. Operação

- **Build/testes**: `npm test`, `npm run lint`, `npm run build` na raiz (scripts delegam ao frontend); backend `.\mvnw.cmd -DskipTests package`.
- **Deploy backend**: push no `main` dispara auto-deploy no Render (Dockerfile).
- **Deploy frontend**: `npx wrangler pages deploy 'web/techocean-web-main/dist' --project-name techocean` (usar o `dist` do frontend, não o da raiz).
- **Variáveis importantes**: `APP_AUTH_SECRET`, credenciais do banco, SMTP (opcional), `VITE_API_URL` (frontend).

## 8. Plano de correção sugerido (prioridade)

1. Revogar sessões ao redefinir senha (item 1).
2. Restringir `/api/backup/admin/**` a ADMIN (item 2).
3. Rate limiting nos endpoints públicos (item 5).
4. Cabeçalhos de segurança/CSP no Cloudflare (item 4).
5. Backups em JSON sem campos sensíveis e em storage persistente (item 6).
