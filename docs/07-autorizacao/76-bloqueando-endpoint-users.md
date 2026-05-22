# Bloqueando `/users`

Continuando as restrições que ficaram bem simples de aplicar, hora de aplicar no endpoint `/users`.

```js
// Trecho de pages/api/v1/users/index.js
const router = createRouter();

// Novamente é injetado o usuário e depois verificado se o mesmo tem permissão
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);
```

E no teste adequamos para que apenas quem não está logado possa criar usuários:

```js
// Trecho de tests/integration/api/v1/users/post.test.js
describe("Default user", () => {
  test("With unique and valid data", async () => {
    const user1 = await orchestrator.createUser();
    await orchestrator.activateUser(user1);
    const user1SessionObject = await orchestrator.createSession(user1.id);

    const user2Response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${user1SessionObject.token}`,
      },
      body: JSON.stringify({
        username: "usuariologado",
        email: "usuariologado@curso.dev",
        password: "senha123",
      }),
    });

    expect(user2Response.status).toBe(403);

    const user2ResponseBody = await user2Response.json();

    expect(user2ResponseBody).toEqual({
      name: "ForbiddenError",
      message: "Você não possui permissão para executar essa ação.",
      action: 'Verifique se o seu usuário possui a feature "create:user"',
      status_code: 403,
    });
  });
});
```
