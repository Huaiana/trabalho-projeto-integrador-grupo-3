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

A API Spring Boot fica disponível, por padrão, em `http://localhost:8080`. Essa é também a URL configurada no `.env` do frontend. Se você alterar a porta da API, atualize `VITE_API_URL` em `web/techocean-web-main/.env` e reinicie o Vite. Para iniciar a API em uma porta alternativa, por exemplo `8081`:

```powershell
cd demo
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

Nesse caso, configure `VITE_API_URL=http://localhost:8081`. Para confirmar que está acessando a API — e não o servidor do site — teste `http://localhost:8081/clientes`; a resposta esperada é `200`. A raiz `/` não é uma rota da API e pode retornar `404`.

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

### Publicar a API no Render

O Blueprint em `backend/techocean-main/render.yaml` prepara o frontend estático, a API Spring Boot e um banco PostgreSQL de teste no Render. O frontend é compilado a partir de `web/techocean-web-main/` e usa `VITE_API_URL` definido no serviço do Render:

1. No Render, crie ou sincronize o Blueprint do repositório `Huaiana/techocean`, apontando o arquivo Blueprint para `backend/techocean-main/render.yaml`, e confirme os recursos definidos nele.
2. Aguarde `techocean-api` e `techocean-site` ficarem disponíveis. O site será publicado em `https://techocean-site.onrender.com` e usa `https://techocean-api.onrender.com` para as chamadas da API.
3. O site também pode ser publicado no Lovable: mantenha o projeto conectado à branch `main` do GitHub, sincronize os commits e use **Publish** no projeto.

Os serviços Render usam planos gratuitos para teste. Podem suspender após inatividade e o banco gratuito é temporário; não use essa configuração para dados importantes ou de produção. O banco criado no Render começa vazio: dados gravados apenas no H2 local não são copiados.

Para desenvolvimento local depois da publicação, mantenha `VITE_API_URL` em `web/techocean-web-main/.env` apontando para a URL local da API (`http://localhost:8080` por padrão). O valor definido no ambiente do serviço Render é injetado durante o build e aponta para a API publicada.

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
