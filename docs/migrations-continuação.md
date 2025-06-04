# Endpoint Migrations

Como vamos adotar testes com dados limpos e em sequencia, o ideal é configurar o `jest` em modo de bateria sequencial de testes chamado de `runInBand` (rodar em uma faixa só).

```js
// trecho package.json
"scripts": {
  "test": "jest --runInBand",
  "test:watch": "jest --watchAll --runInBand",
}
```

## Importando módulos pro Jest

Agora para poder limpar o banco, precisamos executar queries dentro do teste.

Pra isso, é necessário importar o database.js pro Jest. Podemos fazer isso usando o Next.js.

```js
// criado jestconfig.js
// como essa versão do jest ainda não trabalha com ESM(ECMAScript Modules),
// usamos a forma antiga de importação
const nextJest = require("next/jest");

const createNextJestConfig = nextJest(); // configurações que serão criadas
const jestConfig = createNextJestConfig(); // injeta a configuração

module.exports = jestConfig;
```

Agora o jest já está habilitado a fazer importações. Porém, ainda é necessário passar as configurações pra ele criar.

```js
const nextJest = require("next/jest");

const createJestConfig = nextJest(); // configurações que serão criadas
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
}); // uso do npm com módulos personalizados e placeholder precisam estar declarados

module.exports = jestConfig;
```

Agora, para que o ambiente .env.development seja carregado para uso do jest nessa versão:

```js
const dotEnv = require("dotenv");
dotEnv.config({
  path: ".env.development", // habilita o ambiente de desenvolvimento via dotenv
});

const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: ".", // especifica o diretório atual como raiz
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
```

Agora testando se as variáveis de ambiente estão sendo carregadas

```js
// trecho get.test.js
test("GET to /api/v1/migrations should return 200", async () => {
  console.log({
    ambiente_jest: process.env.NODE_ENV,
    postgres_db: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
});
```

Para executar os testes limpos, o jest possui um método chamado `beforeAll`, que executa antes de qualquer outro. Podemos usa-lo pra limpar o banco e fazer testes mais puros.

```js
// trecho get.test.js
import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});

// trecho do post.test.js
import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("POST to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});
```

Dessa forma ao executar a bateria de testes, ambos iram limpar os dados e depois executar.

Refatorando e removendo duplicidade no código

```js
// guardamos as configurares padrão em uma variável para reuso
const defaultMigrationsConfig = {
  databaseUrl: process.env.DATABASE_URL,
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

if (request.method === "GET") {
  console.log("Método GET");

  const migrations = await migrationRunner(defaultMigrationsConfig);

  return response.status(200).json(migrations);
}

// trecho post.test.js
if (request.method === "POST") {
  console.log("Método POST");

  const migrations = await migrationRunner({
    ...defaultMigrationsConfig,
    dryRun: false,
  });

  // demais códigos...
}
```

> Aqui utilizamos o operador spread `...`. Ele serve para espalhar o código de um objeto
> permitindo sobrescrever de forma fácil uma propriedade

E por enquanto, para checarmos se as migrations estão sendo executadas de fato:

```js
// trecho post.test.js
// fazendo 2 posts em sequencia
import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("POST to /api/v1/migrations should return 200", async () => {
  // 1 post
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response1.status).toBe(201); // 201 significa created, que algo foi criado

  const response1Body = await response1.json();

  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);

  // 2 post
  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const response2Body = await response2.json();

  expect(Array.isArray(response2Body)).toBe(true);
});

// endpoint migrations
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const defaultMigrationsConfig = {
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    console.log("Método GET");

    const pendingMigrations = await migrationRunner(defaultMigrationsConfig); // melhor legibilidade, afinal GET só verifica se há pendencias
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    console.log("Método POST");

    // melhor legibilidade, pois o POST efetivamente cria uma migration
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsConfig,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations); // 201 Created. Salvou a migration no banco
    }

    return response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
```
