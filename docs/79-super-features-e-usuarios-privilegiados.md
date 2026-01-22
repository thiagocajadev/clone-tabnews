# Super features

Vamos criar agora super usuários. Pensando em features com a tradução mais adequada como permissões, já que concentramos os direitos de acesso usando features como funcionalidades.

## Padrão de nomenclatura

Continuando a usar o padrão para nomear as features:

```bash
ação:objeto:modificador

# ação -> O que o usuário faz.
# objeto -> O objeto alvo.
# modificador -> Algo que incrementa a relação entre ação e objeto.
```

O que já temos até então:

```bash
# ação e objeto. Os usuários anônimos tem essa permissão.
create:user

# ação e objeto. O Usuário logado consegue atualizar seus próprios dados.
update:user

# ação, objeto e modificador. O Usuário que possui essa permissão
# pode atualizar seus dados e de outros usuários.
update:user:others
```

## Um usuário com super poderes

Agora testamos o usuário privilegiado.

```js
// Trecho de tests/integration/api/v1/users/[username]/patch.test.js
describe("Privileged user", () => {
  test("With `update:user:others` targeting `defaultUser`", async () => {
    const privilegedUser = await orchestrator.createUser();
    const activatedPrivilegedUser =
      await orchestrator.activateUser(privilegedUser);

    // Novo método criado, para concatenar a feature de super usuário
    await orchestrator.addFeaturesToUser(privilegedUser, [
      "update:user:others",
    ]);

    const privilegedUserSession = await orchestrator.createSession(
      activatedPrivilegedUser.id,
    );

    const defaultUser = await orchestrator.createUser();

    const response = await fetch(
      `http://localhost:3000/api/v1/users/${defaultUser.username}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
        body: JSON.stringify({
          username: "AlteradoPorPrivilegiado",
        }),
      },
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: defaultUser.id,
      username: "AlteradoPorPrivilegiado",
      email: defaultUser.email,
      password: responseBody.password,
      features: defaultUser.features,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });

    expect(uuidVersion(responseBody.id)).toBe(4);
    expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

    expect(responseBody.updated_at > responseBody.created_at).toBe(true);
  });
});
```

Implementando o método no `orchestrator`:

```js
// trecho de tests/orchestrator.js
async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features);
  return updatedUser;
}
```

E agora os detalhes de implementação no model `user`

```js
async function addFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          features = array_cat(features, $2),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}
```

Aqui vai um pouco de curiosidade sobre o `cat`, comando muito utilizando no `UNIX`:

> [!TIP]
>
> No **PostgreSQL**, **array_cat()** concatena dois arrays na ordem, retornando um novo array (ex.: {1,2} || {3,4} → {1,2,3,4}).
>
> É útil pra agregar resultados, colunas array ou montar dados incrementalmente em queries.
>
> O **cat** do **Unix** vem de **concatenate**: nasceu pra juntar arquivos e cuspir tudo no stdout — simples, rápido e eterno.

## Hora da recursão

Show! Agora adicionamos um pouco de recursão/composição no model Authorization:

```js
// trecho de models/authorization.js
function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    // chamando de forma recursiva a função can(),
    // autorizando o super usuário a alterar outros usuários
    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}
```
