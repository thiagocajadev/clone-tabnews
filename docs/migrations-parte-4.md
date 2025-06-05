# Migrations - Limpando e melhorando

Continuando as melhorias, vamos remover duplicidade e reutilizar da melhor forma o código.

Para grudar as variáveis concatenando seus valores, podemos usar um módulo extra: `dotenv-expand`.

```powershell
npm install dotenv-expand@11.0.6
```

Agora, podemos atualizar o `.env.development`, utilizando o cifrão para interpolar os valores:

```powershell
POSTGRES_HOST="localhost"
POSTGRES_PORT=5432
POSTGRES_USER="local_user"
POSTGRES_DB="local_db"
POSTGRES_PASSWORD=local_password
DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB
```

Melhorando o `database.js`

```js
// criado método para retornar um novo cliente de conexão com o banco
async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  await client.connect();
  return client;
}

// atualizado método de query para usar o getNewClient
// a principal mudança é o uso do let client
// declaramos o client no início (fora do try) para garantir acesso no finally
// isso permite sempre encerrar a conexão, mesmo em caso de erro
async function query(queryObject) {
  let client; // let permite declarar sem inicializar (valor será atribuído depois)
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    client.end();
  }
}

// exportamos os métodos para uso em controllers ou outros módulos
export default {
  query: query,
  getNewClient: getNewClient,
};

// como as chaves e os nomes são iguais, podemos usar a shorthand (atalho)
export default {
  query,
  getNewClient,
};
```

Refatorando o endpoint `migrations`

```js
// api/v1/migrations/index.js
import database from "infra/database.js"; // adicionada importação do database.js

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationsConfig = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };
  // demais código
}
```

legal, está melhorando, porém dessa forma a conexão não está sendo encerrada de verdade.

```powershell
Método GET
error - Error: Another migration is already running
    at lock (/workspaces/clone-tabnews/node_modules/
```

A conexão do banco está ficando bloqueada (`lock`). Com o código atual, somente parando o servidor web para fechar a conexão de forma forçada.

O uso do dbClient implica em fechar as conexões após seu uso

```js
if (request.method === "GET") {
  console.log("Método GET");

  const pendingMigrations = await migrationRunner(defaultMigrationsConfig);

  await dbClient.end(); // fechamos aqui

  return response.status(200).json(pendingMigrations);
}

if (request.method === "POST") {
  console.log("Método POST");

  const migratedMigrations = await migrationRunner({
    ...defaultMigrationsConfig,
    dryRun: false,
  });

  await dbClient.end(); // e fechamos aqui também

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}
```
