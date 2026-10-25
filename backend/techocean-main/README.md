# Techocean

Sistema para apresentar serviços de segurança e amarração de cargas e disponibilizar uma API REST de apoio à operação.

## Visão geral

O repositório contém duas aplicações independentes:

- **Frontend** (`web/techocean-web-main/`): site institucional, cadastro de clientes e painel administrativo, implementados em HTML, CSS e JavaScript sem framework de interface.
- **API** (`demo/`): aplicação Spring Boot para clientes e administradores, cargas, serviços, contêineres, solicitações, orçamentos, operações, mensagens e agendamentos de visitas.

O site e a API são executados separadamente. A página institucional atual não depende da API para renderizar seu conteúdo.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript, empacotados pelo Vite.
- **API:** Java 21, Spring Boot, Spring Web MVC e Spring Data JPA.
- **Persistência local:** dependência H2 incluída no backend; as configurações da aplicação estão em `demo/src/main/resources/application.properties`.

## Estrutura

```text
.
├── demo/                         # API Java/Spring Boot e testes
└── ../../web/techocean-web-main/ # Frontend HTML/CSS/JavaScript
```

## Pré-requisitos

- Java 21 ou superior.
- Node.js e npm para o site.

O backend usa o Maven Wrapper (`mvnw` / `mvnw.cmd`), portanto não é necessário instalar o Maven globalmente.

## Executar localmente

### API

No Windows, a partir de `backend/techocean-main/`:

```powershell
cd demo
.\mvnw.cmd spring-boot:run
```

No macOS ou Linux, também a partir de `backend/techocean-main/`:

```bash
cd demo
./mvnw spring-boot:run
```

A API Spring Boot fica disponível, por padrão, em `http://localhost:8080`. Em desenvolvimento, o frontend usa o proxy `/api` do Vite, que encaminha as chamadas para a API. Se você alterar a porta da API, atualize o `target` do proxy em `web/techocean-web-main/vite.config.js` e reinicie o Vite. Para iniciar a API em uma porta alternativa, por exemplo `8081`:

```powershell
cd demo
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

Nesse caso, configure o target do proxy Vite para `http://127.0.0.1:8081`. Para confirmar que está acessando a API — e não o servidor do site — teste `http://localhost:8081/clientes`; a resposta esperada é `200`. A raiz `/` não é uma rota da API e pode retornar `404`.

### Site

Em outro terminal, a partir da pasta `web/techocean-web-main/`:

```bash
npm ci
npm run dev
```

Use o endereço local informado pelo Vite no terminal para abrir o site. O Vite usa a porta `5173` por padrão, enquanto a API usa `8080`. O Vite pode carregar as variáveis de ambiente ao iniciar; reinicie-o após alterar `.env`. Para gerar e visualizar a versão de produção:

```bash
npm run build
npm run preview
```

### Publicar no Cloudflare Pages e Railway

O frontend estático é publicado no Cloudflare Pages; a API Java/Spring Boot e o PostgreSQL são executados no Railway. O arquivo `demo/railway.toml` configura o Dockerfile e o healthcheck da API. No monorepo, configure o serviço Railway assim:

1. Crie um projeto no Railway e adicione um serviço PostgreSQL. O banco e a API devem estar no mesmo projeto e ambiente.
2. Adicione um serviço a partir do repositório GitHub para a API. Defina o **Root Directory** como `/backend/techocean-main/demo` e o **Railway Config File** como `/backend/techocean-main/demo/railway.toml`. O Dockerfile selecionado é `Dockerfile`.
3. No serviço da API, defina `SPRING_PROFILES_ACTIVE=production`, `APP_AUTH_SECRET` (secreto estável de pelo menos 32 bytes) e `CORS_ALLOWED_ORIGIN_PATTERNS=https://techocean-web.pages.dev,https://*.techocean-web.pages.dev`. Se usar domínio próprio, inclua sua origem HTTPS nessa lista.
4. Crie variáveis de referência para o banco usando o nome exato do serviço PostgreSQL (o exemplo usa `Postgres`): `DB_HOST=${{Postgres.PGHOST}}`, `DB_PORT=${{Postgres.PGPORT}}`, `DB_NAME=${{Postgres.PGDATABASE}}`, `DB_USER=${{Postgres.PGUSER}}` e `DB_PASSWORD=${{Postgres.PGPASSWORD}}`. Não exponha essas credenciais. Gere um domínio público para a API no Railway e confirme que `https://<domínio-da-api>/actuator/health` responde com status saudável.
5. No Cloudflare Pages, conecte o repositório e use Root Directory `web/techocean-web-main`, build command `npm ci && npm run build` e build output directory `dist`. Defina `VITE_API_URL` como a URL pública HTTPS da API Railway (sem caminho final). A configuração `wrangler.toml` informa a pasta de saída e `public/_redirects` mantém o fallback da SPA.
6. Depois que o Cloudflare Pages criar o site, confirme a URL do projeto Pages e mantenha essa origem em `CORS_ALLOWED_ORIGIN_PATTERNS` no Railway. Após qualquer mudança nas variáveis, redeploy os serviços afetados.

Para configurar o primeiro administrador, defina também `ADMIN_SETUP_TOKEN` como variável **secreta e temporária** no Railway. Use-o uma vez na tela **Acesso administrativo** e remova-o logo após a criação da conta. O banco PostgreSQL novo começa vazio; dados locais ou do banco antigo não são copiados automaticamente. Faça exportação e importação dos dados antes de trocar o tráfego se houver dados a preservar.

Para desenvolvimento local depois da publicação, mantenha o proxy Vite apontando para a API local (`http://127.0.0.1:8080` por padrão). `VITE_API_URL` só é necessário no build publicado.

## API REST

Os endpoints abaixo correspondem aos controladores atuais do backend. Salvo indicação em contrário, os valores de criação e atualização são recebidos como parâmetros de requisição (`@RequestParam`).

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `POST` | `/clientes` | Cadastrar cliente (corpo JSON com `nome`, `cpf`, `telefone`, `email` e `senha`) |
| `POST` | `/clientes/login` | Autenticar cliente (corpo JSON com `email` e `senha`) |
| `GET` | `/clientes` | Listar clientes |
| `GET` | `/clientes/{id}` | Buscar cliente por ID |
| `PUT` | `/clientes/{id}` | Atualizar nome, telefone, e-mail e CPF/CNPJ (corpo JSON) |
| `POST` | `/admin/cadastrar?nome=...&email=...&senha=...&cargo=...` | Cadastrar administrador |
| `POST` | `/admin/login` | Autenticar administrador (corpo JSON com `email` e `senha`) |
| `POST` | `/cargas?descricao=...&peso=...&volume=...&tipoCarga=...&origem=...&destino=...` | Cadastrar carga |
| `GET` | `/cargas` | Listar cargas |
| `GET` | `/cargas/{id}` | Buscar carga por ID |
| `POST` | `/servicos?nome=...&descricao=...&categoria=...&disponivel=...` | Cadastrar serviço |
| `GET` | `/servicos` | Listar serviços disponíveis |
| `GET` | `/servicos/{id}` | Buscar serviço por ID |
| `POST` | `/conteineres?numeroConteiner=...&tipo=...&situacao=...` | Cadastrar contêiner |
| `GET` | `/conteineres` | Listar contêineres |
| `GET` | `/conteineres/{id}` | Buscar contêiner por ID |
| `POST` | `/solicitacoes?clienteId=...&cargaId=...&servicoId=...` | Criar solicitação |
| `GET` | `/solicitacoes` | Listar solicitações |
| `GET` | `/solicitacoes/cliente/{clienteId}` | Listar solicitações de um cliente |
| `GET` | `/solicitacoes/{id}` | Buscar solicitação por ID |
| `PUT` | `/solicitacoes/{id}/status?status=...` | Atualizar status de solicitação |
| `POST` | `/orcamentos?clienteId=...&cargaId=...&servicoId=...` | Criar orçamento com status `PENDENTE` |
| `GET` | `/orcamentos` | Listar orçamentos |
| `GET` | `/orcamentos/cliente/{clienteId}` | Listar orçamentos de um cliente |
| `PUT` | `/orcamentos/{id}/analise?status=...&valorEstimado=...&observacoes=...` | Atualizar análise do orçamento |
| `POST` | `/operacoes?solicitacaoId=...&conteinerId=...&responsavel=...&observacoes=...` | Iniciar operação |
| `GET` | `/operacoes` | Listar operações |
| `PUT` | `/operacoes/{id}/andamento?andamento=...&observacoes=...` | Atualizar andamento da operação |
| `POST` | `/mensagens?clienteId=...&especialista=...&conteudo=...` | Enviar mensagem ao atendimento |
| `GET` | `/mensagens/cliente/{clienteId}` | Listar mensagens de um cliente |
| `PUT` | `/mensagens/{id}/resposta` | Responder mensagem (corpo JSON com `resposta`) |
| `POST` | `/mensagens/contatos` | Registrar contato do site (corpo JSON com `nome`, `email` e `conteudo`) |
| `GET` | `/mensagens/contatos` | Listar mensagens recebidas pelo formulário público |
| `PUT` | `/mensagens/contatos/{id}/resposta` | Responder contato do site (corpo JSON com `resposta`) |
| `DELETE` | `/mensagens/contatos/{id}` | Deletar contato do site |
| `DELETE` | `/mensagens/{id}` | Deletar mensagem de cliente |
| `POST` | `/agendamentos` | Solicitar visita técnica (corpo JSON) |

O formulário “Fale conosco” grava contatos sem exigir cadastro. As mensagens aparecem na seção Mensagens do painel, onde a equipe pode respondê-las. O formulário de visita do site envia a solicitação para `POST /agendamentos` usando a variável `VITE_API_URL`; por padrão, usa `http://localhost:8080`. Envie `nome`, `telefone`, `email`, `dataHora` (data e hora ISO local, por exemplo `2026-10-20T14:30`) e `confirmacao: true`. Para um cliente já cadastrado, inclua `senha`; para um novo cadastro, inclua também `cpf` e uma senha com pelo menos oito caracteres.

## Testes e verificações

Executar os testes do backend:

```powershell
cd demo
.\mvnw.cmd test
```

Executar os testes do site:

```bash
npm test
```

Verificar o estilo do site:

```bash
npm run lint
```
