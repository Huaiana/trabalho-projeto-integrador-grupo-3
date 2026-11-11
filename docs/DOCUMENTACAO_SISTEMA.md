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
- **Relógio dos painéis**: a barra exibe data e hora em `America/Sao_Paulo` nas páginas de acesso e nos painéis, atualizadas a cada segundo com o relógio do dispositivo. A precisão depende da data e hora configuradas no dispositivo; não há sincronização com servidor de horário. Datas de registros e agendamentos existentes mantêm sua interpretação atual.
- **Banco de dados de referências no frontend**: o administrador pode editar valores, tarifas por condição e vincular IDs de serviços, cargas, contêineres e operações na categoria Orçamento. A equipe consulta essas referências ao criar um orçamento; os vínculos não identificados automaticamente devem ser selecionados pelo administrador. As tarifas de 2017 são históricas, exigem confirmação e não calculam automaticamente períodos, adicionais ou impostos. Os dados de referência e os metadados locais de orçamento ficam no navegador, sem sincronização entre dispositivos; os cadastros operacionais continuam utilizando a API.
- **Valores de serviço**: o valor individual do serviço é salvo por ID no navegador e sugerido em novos orçamentos nesse navegador; não é enviado à API. No formulário de serviço, o administrador pode alterar separadamente a tarifa da referência selecionada, salva no Banco de dados local.
- **Referências nos painéis**: ao informar um ID de carga ou selecionar uma carga pelo ID do contêiner, os dados disponíveis preenchem os campos editáveis. Peso, volume, origem e destino ausentes devem ser informados manualmente; a descrição aceita até 255 caracteres. O administrador pode vincular serviços e contêineres às referências de carga no Banco de dados local. Não há associação automática de serviços sem vínculo cadastrado.
- **Descrições locais**: contêineres e operações permitem editar dados da referência em um campo adicional, salvo neste navegador pelo ID operacional. Orçamentos e solicitações também têm descrição local editável; solicitações podem ser filtradas pelo ID operacional e sua descrição pode ser impressa. Esses dados não substituem os campos da API, não são sincronizados entre navegadores ou dispositivos e podem ser perdidos ao limpar os dados do navegador; o site público permanece inalterado.
- **Categorias de solicitação APS**: o painel consulta sete categorias e seus exemplos em uma tabela de referências locais, separada das solicitações recebidas; a busca aceita nomes e IDs, inclusive quando a API não está disponível. O código `SOL` identifica uma referência local, não uma solicitação operacional da API. O administrador pode editar as referências e vincular IDs de serviços, cargas, contêineres, operações e orçamentos no Banco de dados. Apenas os serviços de água e energia são vinculados inicialmente por nome correspondente, quando existentes e sem ambiguidade; os demais vínculos são manuais e não associam automaticamente solicitações recebidas.
- **Solicitações compartilhadas**: os campos ficam no painel de Solicitação, organizados em dados do pedido e referências vinculadas. Os botões de editar e imprimir no cabeçalho usam a solicitação selecionada; as ações também estão disponíveis na lista e na visualização. A referência compartilhada de serviço pode preencher o nome e o vínculo de serviço. Ao selecionar um cliente, um único orçamento operacional é usado para preencher a carga, o serviço e o valor disponíveis; quando há vários, a pessoa escolhe qual usar. O orçamento escolhido é apenas fonte de preenchimento e seu ID não é salvo como vínculo. Nome, categoria, contêiner, operação, prestador e referências sem vínculo comprovado devem ser conferidos ou informados manualmente; valores locais de outros painéis não são sincronizados. Se os dados do servidor não puderem ser carregados, a falha é informada. Cliente, carga e serviço operacionais são obrigatórios para que o ID numérico criado possa ser usado nas operações existentes. O status Sim/Não/Em análise indica a autorização, é separado do status operacional PENDENTE/CONFIRMADO e não bloqueia operações. Data e hora de criação usam o relógio do servidor e são apresentadas em Brasília. O prestador é identificado pelo ID de uma conta da equipe, com nome e perfil registrados no momento da gravação; se essa conta for removida, é necessário escolher outro prestador ao editar.
- **Catálogo compartilhado novo**: na mesma tela o administrador cadastra e edita referências de serviço, carga, contêiner, operação e orçamento no servidor. O catálogo começa vazio por escolha do usuário e não importa, substitui ou sincroniza o Banco de dados local anterior; códigos semelhantes nos dois catálogos são independentes. Os vínculos compartilhados são opcionais e selecionados manualmente; o valor do orçamento é gravado na solicitação e pode ser editado. Referências são exibidas com nome, categoria e descrição. Alterações simultâneas da mesma solicitação ou referência são rejeitadas para evitar sobrescrita silenciosa. O catálogo e as solicitações compartilhadas dependem de banco persistente no servidor: o H2 padrão em memória não sobrevive a reinicializações.

  Para o Worker Cloudflare em `techocean-api-v2/techocean-api`, execute a migração aditiva `migrations/0001_solicitacoes_compartilhadas.sql` uma única vez no D1 de destino, depois de conferir o ambiente e criar backup recuperável, antes de publicar o Worker. Ela não importa dados locais nem altera solicitações anteriores. O backup completo do Worker atualizado inclui as tabelas novas; confirme a restauração do backup do D1. No Worker, o ID negativo do prestador identifica um funcionário da tabela `usuario`; IDs positivos identificam contas de `usuario_admin`, evitando colisões entre tabelas. A API Spring usa apenas IDs positivos de `usuario_admin`; em PostgreSQL, faça backup e verifique as tabelas criadas por `ddl-auto=update`, pois os backups por arquivo Spring não incluem essas tabelas.
- **Formulário de operação**: ao selecionar uma referência OPR, apresenta categoria, cargas principais, IDs e tipos de cargas, IDs de contêineres, berços e produtividade cadastrados. Vínculos ausentes permanecem vazios e podem ser configurados pelo administrador no Banco de dados; IDs CTR de referência não são IDs de contêineres operacionais. Embarque e desembarque são opcionais, informados manualmente como horário de Brasília e guardados apenas neste navegador por ID operacional, sem conversão de fuso ou envio à API. Ver e imprimir exibem esses horários e os dados atuais da referência.
- **Vínculos por ID**: o administrador pode usar **Vincular IDs** nas referências de carga, operação e orçamento para selecionar os registros existentes. Os vínculos automáticos usam apenas dados explícitos: cargas e seus tipos de contêiner, produtos químicos na operação de granéis líquidos, nomes idênticos de serviços e os contêineres especificados nas tarifas históricas aplicáveis a refrigerados, Flat Rack, Open Top e Dry. A migração preserva vínculos já editados e condições alteradas; outros vínculos precisam de confirmação manual. Referências ausentes não são criadas automaticamente.
- **Vínculos nos campos de carga e operação**: a carga mostra em campos próprios os IDs e tipos de contêineres e os serviços cadastrados; sua referência selecionada é salva neste navegador pelo ID operacional e exibida em ver, editar e imprimir. Na operação, os contêineres vinculados diretamente são separados dos contêineres vinculados às cargas, sem assumir que toda combinação serve para uma operação específica. Os campos são informativos: editar vínculos exige acessar o Banco de dados local.

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
