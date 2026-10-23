# Techocean

## Executar localmente

Abra dois terminais na pasta raiz deste repositório.

### Terminal 1 — API Spring Boot

```powershell
# Gere um token temporário local para configurar o primeiro administrador.
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:ADMIN_SETUP_TOKEN = [Convert]::ToBase64String($bytes)

cd backend\techocean-main\demo
.\mvnw.cmd spring-boot:run
```

A API ficará disponível em `http://localhost:8080`.

### Terminal 2 — site

```powershell
npm ci
npm run dev
```

O `npm ci` na raiz instala as dependências do frontend em `web/techocean-web-main/`. O site ficará disponível em `http://localhost:5173`. Em desenvolvimento, chamadas `/api` são encaminhadas pelo Vite ao Spring Boot em `http://127.0.0.1:8080`; assim, o navegador não precisa acessar `localhost` diretamente na API.

### Acessar de outro dispositivo na mesma rede

O Vite já escuta em todas as interfaces (`0.0.0.0`). Descubra o IPv4 deste computador com `ipconfig` e, no outro dispositivo, abra `http://<IPv4-do-computador>:5173` (nesta máquina o IPv4 atual é `10.32.22.85`). O Spring Boot permanece local: o proxy do Vite encaminha as chamadas `/api` para ele. Se o site não abrir, permita conexões TCP de entrada na porta `5173` no Firewall do Windows para redes privadas.

Para gerar o build ou executar verificações do frontend a partir da raiz:

```powershell
npm run build
npm test
npm run lint
```

Se a API estiver em outra porta, atualize o `target` do proxy em `web/techocean-web-main/vite.config.js` e reinicie o Vite. `VITE_API_URL` permanece definido para o endpoint remoto no build de produção.

## Primeiro acesso administrativo

O sistema não cria uma conta ou senha padrão. Antes do primeiro deploy com a API protegida, configure no serviço `techocean-api` do Render, como variáveis **secretas**:

- `APP_AUTH_SECRET`: chave aleatória estável de pelo menos 32 bytes. Mantenha o mesmo valor entre reinícios e não a coloque no repositório nem em variáveis `VITE_*`.
- `ADMIN_SETUP_TOKEN`: token aleatório temporário para criar o primeiro administrador.

Depois do deploy, abra o painel, escolha **Acesso administrativo**, entre na configuração inicial e informe o token junto com nome, e-mail e senha do primeiro administrador. Assim que a conta for criada, remova `ADMIN_SETUP_TOKEN` do serviço do Render e faça novo deploy. O endpoint de configuração também se bloqueia quando já existe um administrador.

O Render exige um `APP_AUTH_SECRET` estável com pelo menos 32 bytes antes de iniciar a API em produção; configure-o como secret no serviço `techocean-api`. Configure `ADMIN_SETUP_TOKEN` como secret temporário, use-o uma única vez na tela inicial e remova-o do ambiente depois que o administrador for criado. Não coloque nenhum desses valores no Git ou em variáveis `VITE_*`, nem os envie em mensagens.

Localmente, o comando acima define apenas um token temporário no terminal atual; a chave de assinatura fica efêmera no perfil de desenvolvimento. Não reutilize esses valores na produção.
