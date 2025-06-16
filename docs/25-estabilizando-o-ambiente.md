# ⚖️ Estabilizando o Ambiente

Chegou a hora de refatorar os scripts para uma correta execução local.

Subir um ambiente sempre é uma tarefa que custosa se não estiver bem documentada e organizada.

Então nada melhor do que melhorar os scripts e adicionar logs de cada etapa.

## 📜 Scripts

Voltando ao package.json, temos o cenário de vários scripts separados pra levantar o ambiente.

O ideal é ter um comando simples, que suba em ordem cada serviço, sem impactar na sequencia.

```js
// alterado o npm run dev
// ele sobe o docker, roda migration e depois o servidor web
"scripts": {
    "dev": "npm run services:up && npm run migration:up && next dev",
    "services:up": "docker compose -f infra/compose.yaml up -d",
    "services:stop": "docker compose -f infra/compose.yaml stop",
    "services:down": "docker compose -f infra/compose.yaml down",
    "lint:check": "prettier --check .",
    "lint:fix": "prettier --write .",
    "test": "jest --runInBand",
    "test:watch": "jest --watchAll --runInBand",
    "migration:create": "node-pg-migrate -m infra/migrations create",
    "migration:up": "node-pg-migrate -m infra/migrations --envPath .env.development up"
  },
```

Mas, olha só o que acontece se apenas concatenamos os comandos:

```powershell
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ npm run dev

> clone-tabnews@1.0.0 dev
> npm run services:up && npm run migration:up && next dev


> clone-tabnews@1.0.0 services:up
> docker compose -f infra/compose.yaml up -d

[+] Running 2/2
 ✔ Network infra_default       Created                                                                      0.1s
 ✔ Container infra-database-1  Started                                                                      0.3s

> clone-tabnews@1.0.0 migration:up
> node-pg-migrate -m infra/migrations --envPath .env.development up

could not connect to postgres: Error: read ECONNRESET
    at TCP.onStreamRead (node:internal/stream_base_commons:217:20) {
  errno: -104,
  code: 'ECONNRESET',
  syscall: 'read'
}
Error: read ECONNRESET
    at TCP.onStreamRead (node:internal/stream_base_commons:217:20) {
  errno: -104,
  code: 'ECONNRESET',
  syscall: 'read'
```

Erro, porque está acontecendo uma `race condition` ou uma competição entre os comandos.

Está tudo sendo executado em paralelo quando o correto é que cada etapa seja concluída para outra iniciar.

### Aguardar o banco de dados

Alterando os scripts pra executar passo a passo:

```js
// package.json
"wait-for-postgres": "node infra/scripts/wait-for-postgres.js"

@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm run wait-for-postgres

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js

🔴 Aguardando Postgres aceitar conexões
```

Definido o nome do container no compose.yaml

```yaml
# compose.yaml
database:
  container_name: "postgres-dev"
```

Agora com o nome definido, é possível verificar se o banco está aceitando conexões.

```bash
@thiagokj ➜ /workspaces/clone-tabnews (main) $ docker exec postgres-dev pg_isready
/var/run/postgresql:5432 - accepting connections
```

Configurando o script para aguardar pelo Postgres:

```js
// wait-for-postgres.js
// essa declaração do exec permite executar comandos externos no node
// usando o require temos maxima compatibilidade
// e o child_process com prefixo node é uma recomendação
// para sabermos que esse módulo é core do node e não de terceiros
const { exec } = require("node:child_process");

function checkPostgres() {}

console.log("🔴 Aguardando Postgres aceitar conexões");
```

Executando comando dentro da função `checkPostgres`:

```js
// o exec recebe 2 parâmetros
// 1º o comando e 2º uma função de callback (retorno)
function checkPostgres() {
  exec("docker exec postgres-dev pg_isready", handleReturn);

  // aqui temos 2 canais padrão
  // stdout = standard output (saída padrão)
  // stderror = standard error (saída de erro padrão)
  function handleReturn(error, stdout) {}
}
```

Agora fazendo um teste com script completo

```js
const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready", handleReturn);

  function handleReturn(error, stdout) {
    if(stdout.search("accepting connections") === -1) {
      console.log("Não aceitando conexões");
      return
    }
  }
}

console.log("🔴 Aguardando Postgres aceitar conexões");
checkPostgres();

// log
@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm rum wait-for-postgres

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js

🔴 Aguardando Postgres aceitar conexões
/var/run/postgresql:5432 - accepting connections

// forçando erro
@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm run wait-for-postgres

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js

🔴 Aguardando Postgres aceitar conexões
Não está aceitando conexões ainda.
```

Para ficar checando a conexão até ela aceitar, podemos adicionar `recursividade`, fazendo a função chamar ela mesma

```js
function handleReturn(error, stdout) {
  if(stdout.search("accepting connections") === -1) {
    console.log("Não aceitando conexões");
    checkPostgres();
    return
  }

// log
@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm run wait-for-postgres

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js

🔴 Aguardando Postgres aceitar conexões
Não está aceitando conexões ainda.
Não está aceitando conexões ainda.
Não está aceitando conexões ainda.
Não está aceitando conexões ainda.
Não está aceitando conexões ainda.
```

Podemos lapidar essa saida, formatando a saída com stdout

```js
// trecho wait-for-postgres.js
  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write("."); // usando write para escrever na saída padrão
      checkPostgres();
      return;
    }

    console.log("\n 🟢 Postgres está pronto e aceitando conexões!"); // pula linha
  }
}

// pula linha. será o início do log junto a escrita do pontinho
process.stdout.write("\n 🔴 Aguardando Postgres aceitar conexões");

// log
@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm run wait-for-postgres

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js


 🔴 Aguardando Postgres aceitar conexões...........................................................
 ...................................................................................................
 ...................................................................................................
 🟢 Postgres está pronto e aceitando conexões!
```

Evitando conflito na execução do pg_isready

```js
// adicionado --host localhost para o pg_isready checar via tcp/ip
// sem especificar o host, ele tenta diretamente via socket UNIX
// passando liberando o script antes da hora para as demais rotinas
function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);
}
```

Depois de testar o fluxo e estar tudo ok, Bora apagar tudo no docker e testar pra valer.

```powershell
docker system prune -a

# log
@thiagokj ➜ /workspaces/clone-tabnews (main) $ docker system prune -a
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all images without at least one container associated to them
  - all build cache

Are you sure you want to continue? [y/N] y
Deleted Images:
untagged: postgres:16.0-alpine3.18
untagged: postgres@sha256:acf5271bbecd4b8733f4e93959a8d2b536a57aeee6cc4b6a71890aaf646425b8
deleted: sha256:5ff2106f0e697e0e8fbcc5f8e791b586d92d9e822bf39d9ddc93ed53d19c65b4
```

> Por convenção em linhas de comando, qual há opção y/N (sim/não), a letra maiúscula será a opção
> padrão ao apertar ENTER.

e agora um log completão bem sucedido

```bash
@thiagokj ➜ /workspaces/clone-tabnews (main) $ npm run dev

> clone-tabnews@1.0.0 dev
> npm run services:up && npm run wait-for-postgres && npm run migration:up && next dev


> clone-tabnews@1.0.0 services:up
> docker compose -f infra/compose.yaml up -d

[+] Running 9/9
 ✔ database Pulled                                                                              8.0s
   ✔ 96526aa774ef Pull complete                                                                 0.4s
   ✔ 0e49271aa953 Pull complete                                                                 1.1s
   ✔ f337d2132cfb Pull complete                                                                 1.7s
   ✔ 0ce1c0abfd65 Pull complete                                                                 7.4s
   ✔ 5ffd2ee5788f Pull complete                                                                 7.5s
   ✔ 0f0a5d4e112f Pull complete                                                                 7.5s
   ✔ d8ca9e62b9f8 Pull complete                                                                 7.5s
   ✔ 7ce50b0b0e2c Pull complete                                                                 7.6s
[+] Running 2/2
 ✔ Network infra_default   Created                                                              0.1s
 ✔ Container postgres-dev  Started                                                              0.3s

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js


 🔴 Aguardando Postgres aceitar conexões.................
 🟢 Postgres está pronto e aceitando conexões!

> clone-tabnews@1.0.0 migration:up
> node-pg-migrate -m infra/migrations --envPath .env.development up

> Migrating files:
> - 1748980342283_test-migrations
### MIGRATION 1748980342283_test-migrations (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748980342283_test-migrations', NOW());


Migrations complete!
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```
