# Techocean

## Executar localmente

Abra dois terminais na pasta raiz deste repositório.

### Terminal 1 — API Spring Boot

```powershell
# Gere um token temporário local para configurar o primeiro administrador.
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:ADMIN_SETUP_TOKEN = [Convert]::ToBase64String($bytes)

.\mvnw.cmd spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.

### Terminal 2 — site

```powershell
npm ci
npm run dev
```

O `npm ci` na raiz instala as dependências do frontend em `web/techocean-web-main/`. O site ficará disponível em `http://localhost:5173`. Em desenvolvimento, as chamadas usam o proxy `/api` do Vite, evitando chamadas cross-origin do navegador. O destino do proxy é `VITE_API_URL`, quando definido, ou o Spring Boot local em `http://127.0.0.1:8080`.

Para evitar que a interface fique carregando indefinidamente quando a API não responde, as requisições expiram após 15 segundos e exibem um erro que permite tentar novamente.

Assim, `web/techocean-web-main/.env` pode apontar `VITE_API_URL` para a API Render ou para uma API local. No build de produção, essa mesma variável define a URL chamada diretamente pelo navegador.

Se a porta `8080` já estiver ocupada, inicie a API em outra porta e configure a URL no terminal do frontend:

```powershell
# Terminal 1
$env:SERVER_PORT = "8081"
.\mvnw.cmd spring-boot:run

# Terminal 2 (o proxy usa VITE_API_URL como destino)
$env:VITE_API_URL = "http://127.0.0.1:8081"
npm run dev
```

### Acessar de outro dispositivo na mesma rede

O Vite já escuta em todas as interfaces (`0.0.0.0`). Descubra o IPv4 deste computador com `ipconfig` e, no outro dispositivo, abra `http://<IPv4-do-computador>:5173` (nesta máquina o IPv4 atual é `10.32.22.85`). As chamadas `/api` passam pelo proxy do Vite, então o navegador não precisa de acesso CORS direto ao Render ou ao Spring Boot. Se o site não abrir, permita conexões TCP de entrada na porta `5173` no Firewall do Windows para redes privadas.

Para gerar o build ou executar verificações do frontend a partir da raiz:

```powershell
npm run build
npm test
npm run lint
```

No deploy, defina `VITE_API_URL` no ambiente de build do Cloudflare Pages para o endpoint remoto.

## Publicação

- **Frontend:** Cloudflare Pages, diretório `web/techocean-web-main`, comando `npm ci && npm run build`, saída `dist`. Defina `VITE_API_URL` como a URL HTTPS pública da API Railway.
- **API e banco:** Railway usando o Dockerfile da raiz e um PostgreSQL no mesmo projeto. Configure `SPRING_PROFILES_ACTIVE=production`, as variáveis `DB_*` ligadas às variáveis `PG*` do PostgreSQL, `APP_AUTH_SECRET` e `CORS_ALLOWED_ORIGIN_PATTERNS` com o domínio Pages do site. As instruções completas estão em [backend/techocean-main/README.md](./backend/techocean-main/README.md).

O banco novo começa vazio. Exporte e importe os dados do banco antigo antes de direcionar o tráfego se precisar preservá-los.

## Primeiro acesso administrativo

O sistema não cria uma conta ou senha padrão. Antes do primeiro deploy com a API protegida, configure no serviço da API no Railway, como variáveis **secretas**:

- `APP_AUTH_SECRET`: chave aleatória estável de pelo menos 32 bytes. Mantenha o mesmo valor entre reinícios e não a coloque no repositório nem em variáveis `VITE_*`.
- `ADMIN_SETUP_TOKEN`: token aleatório temporário para criar o primeiro administrador.

Depois do deploy, abra o painel, escolha **Acesso administrativo**, entre na configuração inicial e informe o token junto com nome, e-mail e senha do primeiro administrador. Assim que a conta for criada, remova `ADMIN_SETUP_TOKEN` do serviço Railway e faça novo deploy. O endpoint de configuração também se bloqueia quando já existe um administrador.

O Railway exige um `APP_AUTH_SECRET` estável com pelo menos 32 bytes antes de iniciar a API em produção; configure-o como secret no serviço da API. Configure `ADMIN_SETUP_TOKEN` como secret temporário, use-o uma única vez na tela inicial e remova-o do ambiente depois que o administrador for criado. Não coloque nenhum desses valores no Git ou em variáveis `VITE_*`, nem os envie em mensagens.

Localmente, o comando acima define apenas um token temporário no terminal atual; a chave de assinatura fica efêmera no perfil de desenvolvimento. Não reutilize esses valores na produção.

Para ver e copiar o token local gerado no terminal, execute `$env:ADMIN_SETUP_TOKEN` no mesmo PowerShell e cole-o no campo **Token de configuração** da tela inicial. O token não é salvo no frontend.
