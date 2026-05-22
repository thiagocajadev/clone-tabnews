# Refatorando o Update

Não tem segredo. Continua a mesma lógica de verificar se o campo foi modificado e então realizara a lógica para atualização.

```js
// trecho de testes em tests/users/[username]/patch.test.js
test("With nonexistent 'username'", async () => {});
test("With duplicated 'username'", async () => {});
test("With duplicated 'email'", async () => {});
test("With unique 'username'", async () => {});
test("With unique 'email'", async () => {});
test("With new 'password'", async () => {});

// método para atualização
async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  // espalhando os valores das propriedades do usuário atual
  // sobrescrevendo com os novos valores informados
  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE 
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}
```
