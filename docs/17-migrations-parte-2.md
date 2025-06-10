# 🔄 Endpoint Migrations

Agora vamos criar um endpoint `/migrations` que vai executar as migrations via API utilizando código JavaScript.

Teremos dois modos de execução:

- **Dry Run**: Apenas simula as migrations sem alterar o banco. Serve para validar o que seria executado.
- **Live Run**: Executa de verdade as migrations no banco.

> 💡 _Dry Run_ vem de simulações feitas por bombeiros, onde o treinamento ocorre sem uso de água.

---

## 🚀 Criando a Rota: `api/v1/migrations`

Começamos com o TDD, criando primeiro o teste de integração:

```js
// tests/integration/api/v1/migrations/get.test.js
test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);
});
```

Como ainda não temos a rota, o teste inicialmente retorna 404.

Agora criamos o arquivo `index.js` da rota:

```js
// api/v1/migrations/index.js
export default async function migrations(request, response) {
  response.status(200).json({});
}
```

### Ajustando o teste para validar o retorno do array:

Como a intenção da API será retornar uma lista de migrations, já ajustamos o teste:

```js
test("GET to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(Array.isArray(responseBody)).toBe(true);
});
```

E atualizamos a rota para retornar um array vazio:

```js
export default async function migrations(request, response) {
  response.status(200).json([]);
}
```

### Rodando apenas esse teste com filtro no `test:watch`:

```powershell
npm run test:watch -- migrations
```

---

## ⚙️ Conectando com o `node-pg-migrate`

Agora vamos executar as migrations de verdade. Para isso, usamos o runner do `node-pg-migrate`:

```js
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const migrations = await migrationRunner({
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true, // apenas simulação
    dir: join("infra", "migrations"),
    direction: "up", // apenas sobe migrations
    verbose: true, // log detalhado
    migrationsTable: "pgmigrations", // tabela de controle
  });

  response.status(200).json(migrations);
}
```

### Exemplo do log gerado no console:

```powershell
> Migrating files:
> - 1748980342283_test-migrations
### MIGRATION 1748980342283_test-migrations (UP) ###
BEGIN;
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748980342283_test-migrations', NOW());
COMMIT;
```

> 🔎 **Nota prática**: o parâmetro `migrationsTable` é opcional, mas é boa prática definir explicitamente o nome para garantir o rastreio correto das migrations.

### Exemplo de resposta retornada:

```js
[
  {
    path: "infra/migrations/1748980342283_test-migrations.js",
    name: "1748980342283_test-migrations",
    timestamp: 1748980342283,
  },
];
```

---

## 🔃 Direção Up vs Down

- **Up**: Executa as alterações "para frente". É o fluxo normal de trabalho.
- **Down**: Permite desfazer migrations (rollback), mas raramente usado em produção.
- **Roll Forward**: Caso haja falha, criamos uma nova migration de correção ao invés de tentar desfazer.

---

## 🚀 Implementando o Live Run (POST)

Agora vamos habilitar a execução real via `POST`.

### Criando o teste de POST:

```js
// tests/integration/api/v1/migrations/post.test.js
test("POST to /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(200);
});
```

### Executando somente os testes de POST com filtro:

Aqui temos 2 variações importantes de filtro, pois dependendo do sistema operacional (Windows, Linux, Mac) a barra pode dar conflito.

**Versão genérica com ponto (mais segura):**

```powershell
npm run test:watch -- migrations.post
```

**Versão com subpasta (Windows):**

```powershell
npm run test:watch -- migrations/post
```

> 💡 Sempre que possível prefira a variação com `migrations.post` usando ponto.

---

## 🔨 Ajustando o endpoint para aceitar GET e POST

```js
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  if (request.method === "GET") {
    console.log("Método GET");

    const migrations = await migrationRunner({
      databaseUrl: process.env.DATABASE_URL,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    });

    return response.status(200).json(migrations);
  }

  if (request.method === "POST") {
    console.log("Método POST");

    const migrations = await migrationRunner({
      databaseUrl: process.env.DATABASE_URL,
      dryRun: false, // executa de verdade
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    });

    return response.status(200).json(migrations);
  }

  return response.status(405).end(); // método não permitido
}
```

---

## 🧪 Logs dos testes e estado do banco

Após executar os testes, veja os logs gerados:

```powershell
 PASS  tests/integration/api/v1/migrations/post.test.js
  ● Console

    console.log
      [
        {
          path: 'infra/migrations/1748980342283_test-migrations.js',
          name: '1748980342283_test-migrations',
          timestamp: 1748980342283
        }
      ]

 PASS  tests/integration/api/v1/migrations/get.test.js
  ● Console

    console.log
      [] // O POST já executou a migration, logo o GET agora retorna vazio
```

---

## 🧹 Estratégias de Teste com Banco de Dados

- **Banco limpo antes de cada teste**: simples, mas não funciona bem com testes paralelos.
- **Rodar testes com transações + rollback**: dá isolamento, mas depende de suporte no framework.
- **Rodar testes sequenciais (fila)**: mais seguro em cenários reais, onde o banco não está limpo.

> 💡 Em produção, é raro ter banco vazio. Por isso, treinar testes nesse contexto é mais realista.

---

✅ Pronto! Agora temos um endpoint funcional de migrations com suporte a execução simulada (`GET`) e real (`POST`), com testes controlados e práticas aplicáveis no dia a dia.
