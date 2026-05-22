# Expirando a sessão

Quando falamos em **deletar/remover** dados, nem sempre essa é a melhor escolha. Pensando sempre em auditoria e histórico, é melhor **expirar/inativar** um registro. Prefira na maioria das vezes o **Soft Delete**.

## Testando o endpoint `/api/v1/sessions`

Para testar a expiração de sessão e entrar no modo guerrilha:

```bash
# executa somente o delete.test.js em sessions
npm run test:watch -- sessions/delete.test.js
```

```js
// trecho de tests/integration/api/v1/sessions/delete.test.js
describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test.only("With nonexistent session", async () => {
      const nonexistentToken =
        "83db352b8e5e14e47ed8899a392771bca10772a47594e3d401be66df4f695ec4908a97841d33dece9c47efed3ccb7057";

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);
      // demais códigos...
    });
  });
});
```

> Para executa apenas um teste específico e pular outras rotinas, use o método `test.only()`.

Saída no terminal:

```bash
 PASS tests/integration/api/v1/sessions/delete.test.js
  DELETE /api/v1/sessions
    Default user
      ✓ With nonexistent session (15 ms)
      ○ skipped With expired session
      ○ skipped With valid session

Test Suites: 1 passed, 1 total
Tests:       2 skipped, 1 passed, 3 total
```

## DeleteHandler no Controller Session

Aqui vamos rotear o uso do método DELETE para fazer a chamada do endpoint e expirar a sessão.

```js
// trecho de pages/api/v1/sessions/index.js
router.delete(deleteHandler);

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  // expira a sessão no banco e depois o cookie no navegador do cliente
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
```

## Método expireById no Model Session

NO MVC, quem interage com o banco de dados é sempre o Model. O Model é quem tem organizado as regras de negócio.

```js
// trecho de models/session.js
async function expireById(sessionId) {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  // Soft Delete, só atualizamos o registro na tabela
  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}
```

## Método `clearSessionCookie` no controller.js

```js
// trecho de infra/controller.js
async function clearSessionCookie(response) {
  // ao invés de salvar um token, enviamos uma informação inválida,
  // além de forçar a expiração com "maxAge - 1"
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}
```

Organizado e simples!
