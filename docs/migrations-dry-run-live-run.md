# Endpoint Migrations

Vamos criar um endpoint `/migrations` que vai executar as migrations usando código javascript.

Para isso temos 2 modos:

- Dry Run: Executa as migrations de mentirinha, como se fosse apenas um rascunho ou um teste pra ver se funcionam.
- Live Run:

> Dry Run ficou conhecido pelas simulações de corpo de bombeiros, sem o uso de água.

Criando a rota: api/v1/migrations

```js
// tests/integration/api/v1/migrations/get.test.js
test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);
});
```

Partindo pelo TDD, temos o retorno 404, então bora criar o index.js dessa rota.

```js
// trecho api/v1/migrations
async function migrations(request, response) {
  response.status(200).json({});
}

export default migrations;

// Pra não repetir o export default, podemos abreviar essa instrução assim
export default async function migrations(request, response) {
  response.status(200).json({});
}
```

O teste para migration precisa retornar um array pois vamos ter uma lista de migrations.

```js
// trecho do test
test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  // Para verificar se retorno é um Array(vetor), o jest faz dessa forma
  expect(Array.isArray(responseBody)).toBe(true);
});

// trecho api/v1/migrations
async function migrations(request, response) {
  // alterado objeto vazio para trazer um array vazio
  response.status(200).json([]);
}
```

Para filtrar e testarmos apenas esse endpoint, basta subir o test:watch com um filtro

```powershell
npm run test:watch -- migrations
```

Executando o migration via endpoint

```js
import migrationRunner from "node-pg-migrate"; // criamos o runner
import { join } from "node:path"; // função para diretorios linux, windows, mac

export default async function migrations(request, response) {
  const migrations = await migrationRunner({
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true, // habilita somente teste
    dir: join("infra", "migrations"),
    direction: "up", // direção do migração up ou down... por convenção, só usar up
    verbose: true, // exibe no console o comando executado
    migrationsTable: "pgmigrations", // define a tabela para gravar as migrations
  });

  response.status(200).json(migrations);
}

// log do servidor com verbose
// > Migrating files:
// > - 1748980342283_test-migrations
// ### MIGRATION 1748980342283_test-migrations (UP) ###
// BEGIN;
// INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748980342283_test-migrations', NOW());
// COMMIT;
```

> Detalhe do migrationsTable. Montando o código de forma orgânica, vemos que esse parâmetro caso nao seja especificado,
> não iria gravar em lugar nenhum. Por isso é importante colocar o mesmo nome usado pelo node-pg

Usando um console.log pra dar uma olhadinha no que está vindo no corpo da resposta:

```js
[
  {
    path: "infra/migrations/1748980342283_test-migrations.js",
    name: "1748980342283_test-migrations",
    timestamp: 1748980342283,
  },
];
```
