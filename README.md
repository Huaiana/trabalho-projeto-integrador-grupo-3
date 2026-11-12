# Techocean

## Executar localmente

Abra dois terminais na pasta raiz deste repositório.

### Terminal 1 — API Spring Boot

```powershell
# Gere um token temporário local para provisionar o primeiro administrador pela API.
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:ADMIN_SETUP_TOKEN = [Convert]::ToBase64String($bytes)

.\mvnw.cmd spring-boot:run
```

A API Spring Boot ficará disponível em `http://localhost:8080`. O frontend abaixo usa, por padrão, o serviço remoto indicado em sua rota `/api`, e não essa API local.

### Terminal 2 — site

```powershell
npm ci
npm run dev
```

O frontend usa React, TypeScript e TanStack Start para hospedar o site em `src/legacy`. O `npm ci` na raiz instala as dependências em `web/techocean-web-main/`. O site ficará disponível em `http://localhost:5173`.

Para evitar que a interface fique carregando indefinidamente quando a API não responde, as requisições expiram após 15 segundos e exibem um erro que permite tentar novamente.

O navegador acessa a rota de servidor `/api`, que encaminha as requisições ao endereço configurado no código em `web/techocean-web-main/src/routes/api/$.ts`. O `.env` anterior foi preservado, mas `VITE_API_URL` não altera esse destino nesta versão.

### Acessar de outro dispositivo na mesma rede

Para acessar o site de outro dispositivo, configure o Vite para escutar na rede local e abra o endereço exibido no terminal. As chamadas `/api` passam pela rota de servidor do frontend, evitando chamadas diretas do navegador à API remota.

Para gerar o build ou executar verificações do frontend a partir da raiz:

```powershell
npm run build
npm test
npm run lint
```

O build TanStack/Nitro gera a saída em `.output`; não use a pasta `dist` do frontend antigo.

## Publicação

- **Frontend:** Cloudflare, diretório `web/techocean-web-main`, comando `npm ci && npm run build`. O build gera a configuração do Worker SSR em `.output/server/wrangler.json`. A rota de servidor `/api` encaminha para a API remota definida no código do frontend.
- **API e banco:** Railway usando o Dockerfile da raiz e um PostgreSQL no mesmo projeto. Configure `SPRING_PROFILES_ACTIVE=production`, as variáveis `DB_*` ligadas às variáveis `PG*` do PostgreSQL, `APP_AUTH_SECRET` e `CORS_ALLOWED_ORIGIN_PATTERNS` com o domínio Pages do site. As instruções completas estão em [backend/techocean-main/README.md](./backend/techocean-main/README.md).

O banco novo começa vazio. Exporte e importe os dados do banco antigo antes de direcionar o tráfego se precisar preservá-los.

## Acesso administrativo

O sistema não cria uma conta ou senha padrão. Para provisionar o primeiro administrador em um banco vazio, configure no serviço da API no Railway, como variáveis **secretas**:

- `APP_AUTH_SECRET`: chave aleatória estável de pelo menos 32 bytes. Mantenha o mesmo valor entre reinícios e não a coloque no repositório nem em variáveis `VITE_*`.
- `ADMIN_SETUP_TOKEN`: token aleatório temporário para o provisionamento inicial pela API.

O provisionamento inicial é feito por uma chamada `POST /admin/setup`, enviando `X-Admin-Setup-Token` e os campos `nome`, `email` e `senha` no corpo JSON. Esse formulário não aparece na tela de login; o endpoint recusa a operação quando já existe um administrador. Assim que a conta for criada, remova `ADMIN_SETUP_TOKEN` do serviço Railway e faça novo deploy.

Depois de entrar como administrador, use **Configurações** no painel para atualizar dados e senhas das contas ou criar novas contas de administrador e equipe. Para editar uma conta sem trocar sua senha, deixe o campo senha em branco.

O Railway exige um `APP_AUTH_SECRET` estável com pelo menos 32 bytes antes de iniciar a API em produção; configure-o como secret no serviço da API. Configure `ADMIN_SETUP_TOKEN` como secret temporário e remova-o do ambiente após o provisionamento inicial. Não coloque nenhum desses valores no Git ou em variáveis `VITE_*`, nem os envie em mensagens.

Localmente, o comando acima define apenas um token temporário no terminal atual; a chave de assinatura fica efêmera no perfil de desenvolvimento. Não reutilize esses valores na produção.

Para consultar o token temporário gerado localmente, execute `$env:ADMIN_SETUP_TOKEN` no mesmo PowerShell e use-o somente no cabeçalho da chamada inicial à API. Não o salve no frontend.
