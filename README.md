# Techocean

## Executar localmente

Abra dois terminais na pasta raiz deste repositório.

### Terminal 1 — API Spring Boot

```powershell
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
