# Ativando o usuário

Alguns testes não refletem bem a realidade. Veja:

```js
// Trecho de tests/integration/_use-cases/registration-flow.test.js
// Esse método só é útil nos testes.
const activationToken = await activation.findOneByUserId(
  createUserResponseBody.id,
);
```

Se um usuário tiver mais do que um código de ativação, um que expirou e um válido. Qual será retornado? Mais recente ou mais antigo?

No mundo real o que teremos: através do **token que chega via e-mail**, conseguimos chegar até o **usuário**.

O token tem que dar match com o usuário criado.

## Desafio surpresa 🎁

Olha que maravilha 🫠. Regras:

1. Extrair o token do corpo do e-mail (regex pode ajudar).
1. Método que busca por um token válido (não expirado e nem utilizado).
1. Comparar os IDs no teste (UserId e Id do usuário criado).
1. Usar o model "session" como inspiração.

## Extraindo o token

```js
// Trecho de tests/orchestrator.js
// Regex recupera uma string de 36 caracteres formada por um grupo de caracteres
// hexadecimais. Eles vão de 0 a 9, e de "a" até "f", minúsculos e maiúsculos,
// separados por traços.
function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}
```

## Modificando o teste

```js
test("Receive activation email", async () => {
  const lastEmail = await orchestrator.getLastEmail();

  expect(lastEmail.sender).toBe("<contato@fintab.com.br>");
  expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
  expect(lastEmail.subject).toBe("Ative seu cadastro no FinTab!");
  expect(lastEmail.text).toContain("RegistrationFlow");

  // Recuperando o token
  const activationTokenId = orchestrator.extractUUID(lastEmail.text);

  // Monitora a URL, garantindo a estrutura
  expect(lastEmail.text).toContain(
    `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
  );

  // Recupera o token válido
  const activationTokenObject =
    await activation.findOneValidById(activationTokenId);

  // Compara o token retornado com o token do email de ativação
  expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
  expect(activationTokenObject.used_at).toBe(null);
});
```

## Recuperando o token válido

```js
// Trecho de models/activation.js
async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);
  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    // Verifica se a data de expiração é maior que a data atual
    // e se o campo used_at está vazio.
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    // Lança erro caso não encontre o token
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}
```

Agora temos um código mais assertivo em relação ao token válido de ativação.
