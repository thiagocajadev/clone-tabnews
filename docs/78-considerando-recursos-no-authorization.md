# Recursos no model Authorization

Agora é hora de modificar o model `authorization` para levar em conta **quem faz (user)**, o **que faz (feature)** e **contra quem (resource)**, prevenindo alterações indevidas entre usuários.

Match em testes:

```bash
npm run test:watch username./patch

# informando o arquivo especifico
npm run test:watch -- tests/integration/api/v1/users/[username]/patch.test.js

# Pode haver falha de interpretação no shell, devido ao uso de colchetes.
# deixo aqui mais uma alternativa.
npm run test:watch:path tests/integration/api/v1/users/[username]/patch.test.js
```

Vamos validar que o usuário autenticado e com permissão para alteração, possa alterar apenas seus próprios dados.

```js
// O recurso está se auto atualizando
userA === userA ✅

// O recurso não pode atualizar outro recurso
userA !== userB ❌
```

Somente um "super usuário" poderia alterar seus próprios recursos e de outros usuários comuns, com um privilégio a mais.

```js
// trecho de pages/api/v1/users/[username]/index.js
async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  // user, feature e resource
  // Recupero o objeto do usuário na request, para usar seu UUID.
  // Depois verifico o usuário alvo a ser alterado.
  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  // Se não tem autorização, proíbe o acesso lançando erro.
  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  return response.status(200).json(updatedUser);
}
```

Agora adicionando a verificação ao método `can` no model `authorization`.

```js
// trecho de models/authorization.js

function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  // Comparamos se o usuário possui a permissão e recurso.
  // Por padrão o ideal é bloquear no mais alto nível. Em segurança, é melhor negar demais do que autorizar demais.
  if (feature === "update:user" && resource) {
    authorized = false;

    // Se o ID do usuário é o mesmo ID do recurso, então ele está tentando se auto atualizar.
    if (user.id === resource.id) {
      authorized = true;
    }
  }

  return authorized;
}
```

Pra finalizar, cobrindo o caso no teste:

```js
// Trecho de tests/integration/api/v1/users/[username]/patch.test.js
test("With `userB` targeting `userA`", async () => {
  await orchestrator.createUser({
    username: "userA",
  });

  const createdUserB = await orchestrator.createUser({
    username: "userB",
  });

  const activatedUserB = await orchestrator.activateUser(createdUserB);
  const sessionObject2 = await orchestrator.createSession(activatedUserB.id);

  const response = await fetch("http://localhost:3000/api/v1/users/userA", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_id=${sessionObject2.token}`,
    },
    body: JSON.stringify({
      username: "userC",
    }),
  });

  // Tem que retornar proibido 403
  expect(response.status).toBe(403);

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    action:
      "Verifique se você possui a feature necessária para atualizar outro usuário.",
    message: "Você não possui permissão para atualizar outro usuário.",
    name: "ForbiddenError",
    status_code: 403,
  });
});
```
