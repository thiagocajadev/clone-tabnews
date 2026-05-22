# Desafio: rotas migrations e status

Vamos aplicar as camadas de segurança de acesso e filtro seguro no retorno das respostas.

## Alterando `/migrations`

Primeiro vamos lidar com o endpoint `/migrations`.

```js
// Trecho de pages/api/v1/migrations/index.js
import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

// Verificação de permissões
router.use(controller.injectAnonymousOrUser);
router.use(controller.canRequest("read:migration"), getHandler);
router.use(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

// Aplicando o filtro de segurança no retorno da resposta
async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}
```

Agora em authorization, checamos a condição do migration:

```js
// Trecho de models/authorization.js
// A maior diferença é que não retornamos um JSON como na resposta,
// mas sim um array.
if (feature === "read:migration") {
  return resource.map((migration) => {
    return {
      path: migration.path,
      name: migration.name,
      timestamp: migration.timestamp,
    };
  });
}
```

No `resource.map` percorremos cada migração e retornamos apenas as propriedades do objeto. Pra cada item encontrado dentro do array, filtramos o que é permitido para a feature e retornamos um novo objeto com as propriedades a serem exibidas.

Agora partimos pra ajustar os testes do tipo GET:

```js
// Trecho de tests/integration/api/v1/migrations/get.test.js
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  // Adicionada verificação das migrações pendentes
  await orchestrator.runPendingMigrations();
});

// E nos testes, restringimos qualquer usuário padrão ou anonimo
describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activatedUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("With `read:migration`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activatedUser(createdUser);
      // Adicionada permissão pro usuário ler as migrações
      await orchestrator.addFeaturesToUser(createdUser, ["read:migration"]);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
```

Ajustando os testes do tipo POST:

```js
// Trecho de tests/integration/api/v1/migrations/post.test.js
// O código é muito parecido com o teste de GET
describe("Privileged user", () => {
  test("With `create:migration`", async () => {
    const createdUser = await orchestrator.createUser();
    const activatedUser = await orchestrator.activateUser(createdUser);
    // Adicionada a feature `create:migration` ao usuário criado
    await orchestrator.addFeaturesToUser(createdUser, ["create:migration"]);
    const sessionObject = await orchestrator.createSession(activatedUser.id);

    // Aqui declaramos o tipo de método como POST
    const response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "POST",
      headers: {
        Cookie: `session_id=${sessionObject.token}`,
      },
    });

    // Aqui um trade-off. Deixamos por enquanto apenas um retorno 200,
    // Pois as migrations já são executadas pelo Orchestrator.
    // Futuramente pode ser melhorado esse caso de teste.
    expect(response.status).toBe(200);

    const responseBody = await response.json();

    expect(Array.isArray(responseBody)).toBe(true);
  });
});
```

## Alterando `/status`

Organizando o endpoint com as instruções de permissões de segurança, temos:

```js
// Trecho de pages/api/v1/status/index.js

// Guardamos o retorno em um objeto e devolvemos a resposta segura
const statusObject = {
  updated_at: updatedAt,
  dependencies: {
    database: {
      version: databaseVersionValue,
      max_connections: parseInt(databaseMaxConnectionsValue),
      opened_connections: databaseOpenedConnectionsValue,
    },
  },
};

const secureOutputValues = authorization.filterOutput(
  userTryingToGet,
  "read:status",
  statusObject,
);

response.status(200).json(secureOutputValues);
```

E no model authorization, fazemos a checagem:

```js
// Trecho de models/authorization.js
if (feature === "read:status") {
  const output = {
    updated_at: resource.updated_at,
    dependencies: {
      database: {
        max_connections: resource.dependencies.database.max_connections,
        opened_connections: resource.dependencies.database.opened_connections,
      },
    },
  };

  // Permissão de usuário privilegiado, mostra a versão
  if (can(user, "read:status:all")) {
    output.dependencies.database.version =
      resource.dependencies.database.version;
  }

  return output;
}
```

Ajustando os testes:

```js
// Trecho de tests/integration/api/v1/status/get.test.js
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      // Verificação que essa propriedade não pode ser exibida
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatePrivilegedUser =
        await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, ["read:status:all"]);

      const privilegedUserSession = await orchestrator.createSession(
        activatePrivilegedUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      // Usuário privilegiado tem acesso a versão do banco de dados
      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
```

É isso ai!
