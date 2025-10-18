# Criando token de ativação

Hora de criar o token, sem medo de pisar nas bombas 💣💣💣.

```js
// trecho de pages/api/v1/users/index.js

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  // Especulando método create
  await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser);

  return response.status(201).json(newUser);
}
```

## Criando a tabela via migration

```bash
# Migration para criar a tabela de tokens de ativação de usuário
npm run migrations:create create user activation tokens
```

A estrutura da tabela fica assim:

```js
exports.up = (pgm) => {
  pgm.createTable("user_activation_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // Caso seja informada data de uso, quer dizer que o token foi usado.
    used_at: {
      type: "timestamptz",
      notNull: false,
    },

    user_id: {
      type: "uuid",
      notNUll: true,
    },

    expires_at: {
      type: "timestamptz",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
```

> [!WARNING]
> Usar o id da tabela como token abre uma brecha de segurança. Ela será mostrada mais a frente pra gente entender,
> tratar e ganhar imunidade contra esse potencial problema de segurança.

## Detalhes de implementação do método create

Voltando ao model `activation.js`

```js
// Trecho de models/activation.js
import database from "infra/database.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}
```

## Criando o webserver.js

Aqui vamos configurar de uma forma ergonômica o uso da url de ativação em diversos ambientes. Esse recurso flexibiliza o código e pode ser reaproveitado em outras ocasiões.

```js
// Trecho de infra/webserver.js
function getOrigin() {
  // Para ambiente local
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }

  // Recuperando o ambiente preview com as variáveis de ambiente fornecidas pela Vercel
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Padrão em produção
  return "https://fintab.com.br";
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
```

## Refatorando o sendEmailToUser

Agora precisamos enviar o token como segundo parâmetro no método.

```js
// Trecho de pages/api/v1/users/index.js
async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  // Guardamos em uma variável o token de ativação
  const activationToken = await activation.create(newUser.id);

  // Envia o token junto com o e-mail pro usuário
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(newUser);
}
```

O método `sendEmailToUser` fica assim:

```js
// Trecho de models/activation.js
async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: createEmailText(),
  });

  // Agora usamos o webserver.origin, que indica qual ambiente está sendo gerada a url de ativação,
  // facilitando os testes.
  function createEmailText() {
    return `
    ${user.username}, clique no link abaixo para ativar seu cadastro no FinTab

    ${webserver.origin}/cadastro/ativar/${activationToken.id}

    Atenciosamente,
    Equipe FinTab.
    `;
  }
}
```

## Ajustando os assertions no registration-flow

Para recuperar o token no momento de criação do usuário, vamos guardar o responseBody em uma variável

```js
// Trecho de tests/integration/_use-cases/registration-flow.test.js
describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;

  test("Create user account", async () => {})
  // ... Demais códigos

  // Agora no teste de recebimento de email
  test("Receive activation email", async () => {
  const lastEmail = await orchestrator.getLastEmail();

  // Criando um novo método pra recuperar a ativação pelo UserId
  const activationToken = await activation.findOneByUserId(
    createUserResponseBody.id,
  );

  expect(lastEmail.sender).toBe("<contato@fintab.com.br>");
  expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
  expect(lastEmail.subject).toBe("Ative seu cadastro no FinTab!");
  expect(lastEmail.text).toContain("RegistrationFlow");
});
}
```

Implementação do método `findOneByUserId` no model `activation`.

```js
// Trecho de models/activation.js
async function findOneByUserId(userId) {
  const newToken = await runSelectQuery(userId);
  return newToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
      ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}
```

Por fim, ajustando o teste pra verificar se o email contém o id do token de ativação

```js
test("Receive activation email", async () => {
  const lastEmail = await orchestrator.getLastEmail();

  const activationToken = await activation.findOneByUserId(
    createUserResponseBody.id,
  );

  expect(lastEmail.sender).toBe("<contato@fintab.com.br>");
  expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
  expect(lastEmail.subject).toBe("Ative seu cadastro no FinTab!");
  expect(lastEmail.text).toContain("RegistrationFlow");

  // Verificando nesse trecho
  expect(lastEmail.text).toContain(activationToken.id);
});
```

Saída no console

```bash
PASS  tests/integration/_use-cases/registration-flow.test.js
  Use case: Registration Flow (all successful)
    ✓ Create user account (74 ms)
    ✓ Receive activation email (12 ms)
    ✓ Activate account
    ✓ Login
    ✓ Get user information (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Apagando a linha com o token pra ver se é verdade:

```bash
# Falha mesmo, de verdade 😄.
 FAIL  tests/integration/_use-cases/registration-flow.test.js
  Use case: Registration Flow (all successful)
    ✓ Create user account (94 ms)
    ✕ Receive activation email (13 ms)
    ✓ Activate account
    ✓ Login
    ✓ Get user information (1 ms)

  ● Use case: Registration Flow (all successful) › Receive activation email

    expect(received).toContain(expected) // indexOf

    Expected substring: "66515745-717d-43b1-8242-fa38314f35c4"
    Received string:    "
        RegistrationFlow, clique no link abaixo para ativar seu cadastro no FinTab··
        Atenciosamente,
        Equipe FinTab.·····
    "
```
