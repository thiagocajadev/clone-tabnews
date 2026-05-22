# Autenticando via Endpoint

Mantendo a didática, será criado um endpoint `/user`. Com ele, será quebrada a **regra de ouro** de uma API REST, pois ao fazer uma chamada via GET, os dados devem apenas devem ser lidos (READ). Nesse caso específico, além do READ, será feita escrita (WRITE) na propriedade `expires_at`, renovando a sessão do usuário, caso ela exista.

Preparando o desenvolvimento, criando em sequencia:

1. Rota para o endpoint em `api/v1/user`.
1. Novas regras de negócios nos models `models/session.js` e `models/user.js`.
1. Testes usando **http GET** em `tests/user/get.test.js`.

## Rota `/user`

```js
// pages/api/v1/user/index.js
import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();

// Criada rota para chamada do tipo GET
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  // Recupera o token do cabeçalho da request
  const sessionToken = request.cookies.session_id;

  // Com o token, procura por uma sessão válida que ainda não expirou
  const sessionObject = await session.findOneValidByToken(sessionToken);

  // Para recuperar o usuário, passa o Id do usuário retornado na sessão
  const userFound = await user.findOneById(sessionObject.user_id);
  return response.status(200).json(userFound);
}
```

## Implementando os métodos declarados no Endpoint

Detalhes de implementação ficam organizados nas respectivas models. Nesse caso `session.js` e `user.js`.

```js
// models/session.js
async function findOneValidByToken(sessionToken) {
  // Boa prática ao abstrair no topo do método a ação e retorno
  const sessionFound = await runSelectQuery(sessionToken);
  return sessionFound;

  // detalhes da query
  async function runSelectQuery(sessionToken) {
    // aqui o filtro garante apenas sessões que não expiraram até a data atual
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    return results.rows[0];
  }
}
```

Agora a pesquisa pra encontrar um usuário por ID.

```js
// models/user.js
async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  // Consulta similar ao retorno por nome de usuário, mudando o parâmetro de busca por ID
  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
        ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id foi digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}
```

## Realizando testes

Exemplo até o momento de um teste de integração feito contra a rota `/user`.

```js
// tests/integration/api/v1/user/get.test.js
import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  // Aqui temos uma diferença dos outros testes, deixando de usar um usuário anônimo
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      // Após criar o usuário, é criada a sessão pra ele, passando o ID do usuário
      const sessionObject = await orchestrator.createSession(createdUser.id);

      // Busca contro o endpoint "/user", passando via cabeçalho o token da sessão
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
```

Detalhes do método que cria sessão via Orquestrador:

```js
// tests/orchestrator.js
// Já existe a lógica pra criar uma sessão no model session.
// Código limpo para uso do orchestrator
async function createSession(userId) {
  return await session.create(userId);
}
```
