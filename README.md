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

O `npm ci` na raiz instala as dependências do frontend em `web/techocean-web-main/`. O site ficará disponível em `http://localhost:5173` e já está configurado para acessar a API em `http://localhost:8080`.

Para gerar o build ou executar verificações do frontend a partir da raiz:

```powershell
npm run build
npm test
npm run lint
```

Se a API estiver em outra porta, atualize `VITE_API_URL` em `web/techocean-web-main/.env` e reinicie o Vite.
