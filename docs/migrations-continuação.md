# 🚀 Endpoint de Migrations com Jest e Node-pg-migrate

Nesse módulo, vamos estruturar nossos testes para trabalhar com migrations de banco de dados de forma limpa, sequencial e controlada.

Como estamos falando de banco de dados, **ordem e isolamento de testes** são fundamentais para evitar testes flutuantes e falsos positivos.

---

## 🎯 Configurando o Jest em modo sequencial (`runInBand`)

Por padrão, o Jest executa os testes em paralelo. Como vamos interagir com o banco, é importante que eles rodem em fila, um por vez, para evitar concorrência indesejada.

No `package.json`, configuramos os scripts:

```json
"scripts": {
  "test": "jest --runInBand",
  "test:watch": "jest --watchAll --runInBand"
}
```

> ✅ `--runInBand`: força o Jest a rodar os testes sequencialmente (modo bateria), ideal para testes que mexem com banco de dados.

---

## 🔌 Importando módulos no Jest com Next.js

Como estamos usando Next.js, podemos aproveitar o `next/jest` para preparar o ambiente de testes.

Criamos um arquivo `jest.config.js`:

```js
// jest.config.js
const nextJest = require("next/jest");

const createNextJestConfig = nextJest();
const jestConfig = createNextJestConfig();

module.exports = jestConfig;
```

Agora o Jest já consegue trabalhar com a estrutura do projeto Next.js.

---

## 🎯 Permitindo imports absolutos no Jest

Se você usa `import database from "infra/database"`, por exemplo, precisa configurar os diretórios base no Jest:

```js
const nextJest = require("next/jest");

const createJestConfig = nextJest();

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
```

Assim o Jest entende os imports absolutos da raiz do projeto.

---

## 🔐 Carregando variáveis de ambiente no Jest

Por padrão o Jest não carrega o `.env.development`. Precisamos forçar isso com `dotenv`:

```bash
npm install dotenv --save-dev
```

Agora adicionamos no `jest.config.js`:

```js
const dotEnv = require("dotenv");
dotEnv.config({
  path: ".env.development", // força o carregamento do ambiente de dev
});

const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "." });

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
```

Agora o Jest já tem acesso às variáveis de ambiente.

---

## 🧪 Validando se o ambiente foi carregado corretamente

Testamos se as variáveis estão acessíveis no teste:

```js
test("GET to /api/v1/migrations should return 200", async () => {
  console.log({
    ambiente_jest: process.env.NODE_ENV,
    postgres_db: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
});
```

Se tudo certo, o console irá exibir as variáveis carregadas.

---

## 🧹 Limpeza automática de banco antes dos testes

Para garantir consistência, vamos usar o `beforeAll` para limpar o banco antes de cada suite de teste:

```js
import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}
```

> ⚠️ Esse comando zera todo o banco, útil apenas em ambiente de teste.

---

## 🧪 Testes GET e POST de migrations

Agora criamos os testes reais:

### Teste GET (verifica pendências)

```js
test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});
```

### Teste POST (executa as migrations)

```js
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

---

## 🔄 Melhorando o código com reaproveitamento (evitando duplicação)

Definimos uma configuração padrão de migrations, que pode ser herdada pelos métodos GET e POST:

```js
const defaultMigrationsConfig = {
  databaseUrl: process.env.DATABASE_URL,
  dryRun: true, // default: só simula
  dir: join("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

if (request.method === "GET") {
  const migrations = await migrationRunner(defaultMigrationsConfig);
  return response.status(200).json(migrations);
}

if (request.method === "POST") {
  const migrations = await migrationRunner({
    ...defaultMigrationsConfig,
    dryRun: false, // agora realmente executa
  });

  return response.status(200).json(migrations);
}
```

> 💡 Aqui usamos o **spread operator (`...`)** para reaproveitar a configuração base, alterando apenas o `dryRun`.

---

## 🔁 Validando múltiplas execuções de migrations (idempotência)

Fazemos dois posts em sequência para validar o comportamento:

```js
import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

test("POST to /api/v1/migrations should return 200", async () => {
  // 1º POST - deve criar
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response1.status).toBe(201);

  const response1Body = await response1.json();
  expect(Array.isArray(response1Body)).toBe(true);
  expect(response1Body.length).toBeGreaterThan(0);

  // 2º POST - já não há novas migrations
  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);

  const response2Body = await response2.json();
  expect(Array.isArray(response2Body)).toBe(true);
});
```

---

## 🛠️ Endpoint final consolidado

Então a controller até o momento fica assim:

```js
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
    const pendingMigrations = await migrationRunner(defaultMigrationsConfig);
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    console.log("Método POST");
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsConfig,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
```

> ✅ GET: lista pendências  
> ✅ POST: executa migrations

---

Agora o endpoint de migrations subindo de nível.
