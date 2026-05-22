# Padronizando Controllers

Padronizar as coisas garante que elas tenham o **mesmo comportamento**.

No estado atual, os endpoints permitem quaisquer tipos de requisições contra eles como GET, POST, PUT, etc. Vamos resolver isso começando pelo uso do `next-connect`.

```bash
# instala a versão exata sem fazer upgrade de pacotes
npm i -E next-connect@1.0.0
```

> Caso esteja usando Codespaces e precise recriar o container do espaço de trabalho, faça um commit.
> Agora pesquise no VS Code a opção Rebuild Container

Melhorando o endpoint `status`, vamos criar testes e **níveis de abstrações**

- **Nível 0:** Do jeito que está atualmente, com código misturado com detalhes de implementação dentro do controller.
- **Nível 1:** Usar next-connect, definindo quais métodos são aceitos.
- **Nível 2:** Lógicas de tratamento de erros abstraídas e compartilhadas por cada controller.
- **Nível 3:** Todo next-connect é abstraído dentro de outra abstração, centralizando comportamentos de sucesso e fracasso.

## Nível 1 de abstração

```js
// feita copia do get.test.js para realizar testes
// post.test.js
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      expect(response.status).toBe(405);
    });
  });
});
```

```js
// api/v1/status/index.js
// importa o next-connect, desestruturando o objeto e trazendo a criação de rotas
import { createRouter } from "next-connect";

// cria o objeto que define as rotas
const router = createRouter();

// agora, as rotas podem ser definidas conforme o método definido para cada uma
router.get(...);
router.post(...);

// e esse método irá devolver a respectiva rota na requisição
export default router.handler();
```

Agora a especificação precisa lidar com o request e response. Nesse caso já temos a função status que possui as duas propriedades.

```js
// aqui o handler devolve qual método lida com o request e response
router.get(status);

// padronizando o nome do método para reuso em outros endpoints
router.get(getHandler);

export default router.handler();

async function getHandler(request, response) {
  try {
    const updatedAt = new Date().toISOString();
  }
  // demais códigos...
}
```

Agora ao realizar testes, o post não é mais aceito

```bash
● POST /api/v1/status › Anonymous user › Retrieving current system status

  expect(received).toBe(expected) // Object.is equality

  Expected: 405
  Received: 404

    11 | method: "POST",
```

Ajustando o post.test.js

```js
// comparando diretamente se o formato do json volta no corpo da resposta assim
const responseBody = await response.json();

expect(responseBody).toEqual({
  name: "MethodNotAllowedError",
  message: "Método não permitido para este endpoint.",
  action: "Verifique se o método HTTP enviado é válido para esse endpoint.",
  status_code: 405,
});

// criando novo método na classe Errors.js
export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido para este endpoint.");
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique se o método HTTP enviado é válido para esse endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
```

Refatorando o endpoint status

```js
import { createRouter } from "next-connect";
import database from "infra/database";
// importado novo método de erro MethodNotAllowedError
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
});

function onNoMatchHandler(request, response) {
  // atribuído método no response, passando o objeto formatado
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function getHandler(request, response) // demais códigos...
```

Então, se o client fizer uma requisição, a resposta no corpo será o objeto JSON formatado do jeito que fizemos!

### Melhorando a abstração de manipuladores de erros

```js
// trecho do getHandler em api/v1/status/index.js
// do jeito que está hoje, esse tratamento de erro tem que ser copiado
// para cada handler de cada nova rota POST, GET, PUT, DELETE
catch (error) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do Controller");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}
```

Então podemos abstrair todo o tratamento de erro para o `router.handler`, definindo os detalhes de implementação na propriedade `onError`

```js
// api/v1/status/index.js
export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

// outros códigos ocultados...

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

// e agora todo o bloco try catch pode ser removido do getHandler
async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseVersionResult = await database.query("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionsValue =
    databaseMaxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  });
}
```

### Refatorando o endpoint /migrations

Pra começar, usando o modo watch do jest.

```bash
npm run test:watch -- migrations
```

Aproveitando o código refatorado do endpoint /status

```js
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(migrations);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }
}
```

Uma boa prática inicial em códigos, é olhar para sintaxe e separar o que é infraestrutura do que não é.

Como o router do next-connect configura qual rota é utilizada para cada tipo de chamada http, trechos do código podem ser removidos, pois são redundantes.

```js
// refatorando, removendo as duplicidades de condicionais do GET e POST
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

async function getHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    return response.status(200).json(pendingMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
```

Agora movendo o objeto pra cima `defaultMigrationOptions`, esparramando ele com **spread**(...) e sobrescrevendo e adicionando variáveis a ele.

```js
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return response.status(200).json(pendingMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
```

O método `onErrorHandler` já lança erro pra nós, então pode ser removido

```js
import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    await dbClient.end();
  }
}
```
