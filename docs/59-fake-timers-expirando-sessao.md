# ⏲️ Expirando sessões

Para testarmos a passagem do tempo, temos uma solução bem massa chamada `Fake Timers`. Aqui é possível simular 30 dias a frente e depois voltar. Isso traz ao cenário de testes maior confiabilidade.

Um passo antes disso, adicionamos um teste contra uma sessão inexistente:

```js
// tests/integration/api/v1/user/get.test.js
test("With nonexistent session", async () => {
  // Token fixado no teste. É mais fácil ganhar na mega-sena do que haver uma colisão aqui. 😄
  const nonexistentToken = "83db352b8e5e14e47ed8899a392771bca107...";

  const response = await fetch("http://localhost:3000/api/v1/user", {
    headers: {
      Cookie: `session_id=${nonexistentToken}`,
    },
  });

  expect(response.status).toBe(401);

  const responseBody = await response.json();

  // Se não retornou o uma sessão ativa, não autoriza o acesso
  expect(responseBody).toEqual({
    name: "UnauthorizedError",
    message: "Usuário não possui sessão ativa.",
    action: "Verifique se este usuário está logado e tente novamente.",
    status_code: 401,
  });
});
```
