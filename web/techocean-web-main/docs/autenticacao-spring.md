# Autenticação necessária no Spring Boot

O front-end usa uma sessão segura mantida por cookie. A API deve disponibilizar:

- `POST /auth/login` — recebe `{ "email": "...", "senha": "..." }`, confere a senha criptografada e cria a sessão.
- `GET /auth/me` — retorna o usuário da sessão ou HTTP 401.
- `POST /auth/logout` — encerra a sessão.

Resposta esperada de `/auth/login` e `/auth/me`:

```json
{ "id": 1, "nome": "Nome do usuário", "email": "usuario@empresa.com", "cargo": "Administrador" }
```

Requisitos de segurança:

- Armazenar senhas com BCrypt; nunca guardar ou devolver a senha pura.
- Enviar o identificador da sessão em cookie `HttpOnly`, `Secure` em produção e `SameSite` adequado ao domínio usado.
- Permitir credenciais no CORS (`allowCredentials(true)`) e listar explicitamente os endereços autorizados; não usar `*`.
- Exigir autenticação nas rotas `/cargas`, `/clientes` e nas demais rotas administrativas.
- Retornar HTTP 401 para credenciais inválidas ou sessão ausente.