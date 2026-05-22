# Estabilizando testes locais

## Deletando branches antigas

Antes de iniciar as alterações, vamos recapitular os passos para interação com git e github via `git log --graph`:

```powershell
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ git log --graph
* commit af304f0a1c50356c867db501c131128a82914657 (HEAD -> main, origin/main, origin/HEAD)
| Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| Date:   Mon Jun 16 12:00:40 2025 +0000
|
|     doc estabilizando o ambiente
|
*   commit c325cdba312b2862106e2c9e06a50a4127b7f05d
|\  Merge: 9bcac26 12213e7
| | Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| | Date:   Mon Jun 16 08:42:22 2025 -0300
| |
| |     Merge pull request #13 from thiagokj/wait-for-postgres
| |
| |     add `wait-for-postgres` script
| |
| * commit 12213e70cd25d23a90693151fd64455034ceb94d (origin/wait-for-postgres, wait-for-postgres)
|/  Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
|   Date:   Mon Jun 16 11:39:20 2025 +0000
|
|       add `wait-for-postgres` script
|
```

De baixo pra cima:

1. Criada branch local `wait-for-postgres`, adicionando os arquivos alterados. Na sequencia, criada branch remota (origin) no github com vinculo a branch local, permitindo o push para enviar os arquivos.

   ```powershell
   git checkout -b wait-for-postgres # cria branch e utiliza ela
   git add -A # adiciona todos os arquivos pra branch atual
   git commit -m 'add `wait-for-postgres` script'
   git push origin wait-for-postgres # envia os arquivos pra branch remota (cria) no github
   ```

1. No GitHub é feita abertura do PR - Pull Request, solicitando empurrar as alterações para branch principal.

1. O GitHub permite o processo de revisão com todas as alterações para aprovação.

1. Após aprovação, temos a permissão para fazer o merge entre a branch com as alterações e a branch principal.

1. Feito o merge, as alterações da branch `wait-for-postgres` são incorporadas a `main`, criando um novo commit.

   > Merge: 9bcac26 12213e7. Aqui temos o hash **12213e7** do commit da branch de feature e **9bcac26** o hash do commit criado, unindo as alterações na branch main.

1. Agora, a branch remota `wait-for-postgres` já não precisa existir e pode ser apagada.

1. Por último, temos um commit e push direto na main, atualizando documentação do projeto.

> Após fazer o checkout é uma boa pratica fazer um **git pull** na branch que estiver trabalhando.
> Dessa forma, você atualiza a branch com as alterações remotas mais recentes.

### Checando e apagando

Após conferir no git log o histórico de commits e merges realizados, temos maior segurança para apagar uma branch antiga. E se por algum acaso apagar sem querer, é possível voltar, sem problemas, desde que não passe muito tempo.

```powershell
git branch # listando as branches
git branch -d nome-da-branch # apaga a branch

# log das branches locais excluídas
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ git branch -d feature fix-migrations-endpoint wait-for-postgres
Deleted branch feature (was c6ed766).
Deleted branch fix-migrations-endpoint (was f755bd6).
Deleted branch wait-for-postgres (was 12213e7).
```

## fix-npm-test

Esse é um bom nome de branch para uma tarefa de resolução dos testes, ajustando os scripts.

```powershell
# puxa as alterações da main no github pra main local
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ git pull
Already up to date.

# cria uma nova branch com base na main local com alterações mais recentes
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ git checkout -b fix-npm-test
Switched to a new branch 'fix-npm-test'

# o checkout já faz a troca pra branch, permitindo o trabalho isolado e controlado
@thiagokj ➜ /workspaces/clone-tabnews/docs (fix-npm-test) $
```

Rodando o `npm test` ele executa o jest no padrão em sequência. Temos então erro de conexão ao banco e erro nos endpoints.

```js
// ajustando o script npm test no package.json
"test": "npm run services:up && npm run wait-for-postgres && jest --runInBand",
```

Mesmo rodando esse comando ajustado, ainda sim temos problemas com o servidor web para rodar em paralelo com o jest.

Pra resolver isso, bora instalar o modulo que permite a execução concorrente do next e do jest, o `concurrently`

```powershell
npm install --save-dev concurrently@8.2.2

# depois ajustando o comando no package.json
"test": "npm run services:up && npm run wait-for-postgres && concurrently 'next dev' 'jest --runInBand'"
```

Então, analisando o log de execução:

```powershell
@thiagokj ➜ /workspaces/clone-tabnews/docs (fix-npm-test) $ npm test

> clone-tabnews@1.0.0 test
> npm run services:up && npm run wait-for-postgres && concurrently 'next dev' 'jest --runInBand'


> clone-tabnews@1.0.0 services:up
> docker compose -f infra/compose.yaml up -d

[+] Running 1/1
 ✔ Container postgres-dev  Running                                                   0.0s

> clone-tabnews@1.0.0 wait-for-postgres
> node infra/scripts/wait-for-postgres.js


🔴 Aguardando Postgres aceitar conexões
🟢 Postgres está pronto e aceitando conexões!

[0] ready - started server on 0.0.0.0:3000, url: http://localhost:3000
[0] info  - Loaded env from /workspaces/clone-tabnews/.env.development
[0] event - compiled client and server successfully in 1058 ms (149 modules)
[0] wait  - compiling /api/v1/migrations (client and server)...
[0] event - compiled successfully in 56 ms (41 modules)
[0] > Migrating files:
[0] > - 1748980342283_test-migrations
[0] ### MIGRATION 1748980342283_test-migrations (UP) ###
[0] BEGIN;
[0] INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748980342283_test-migrations', NOW());
[0] COMMIT;
[0]
[0]
[0] No migrations to run!
[1]  PASS  tests/integration/api/v1/migrations/post.test.js
[0] > Migrating files:
[0] > - 1748980342283_test-migrations
[0] ### MIGRATION 1748980342283_test-migrations (UP) ###
[0] BEGIN;
[0] INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748980342283_test-migrations', NOW());
[0] COMMIT;
[0]
[0]
[1]  PASS  tests/integration/api/v1/migrations/get.test.js
[0] wait  - compiling /api/v1/status (client and server)...
[0] event - compiled successfully in 57 ms (42 modules)
[1]  PASS  tests/integration/api/v1/status/get.test.js
[1]
[1] Test Suites: 3 passed, 3 total
[1] Tests:       3 passed, 3 total
[1] Snapshots:   0 total
[1] Time:        2.633 s
[1] Ran all test suites.
[1] jest --runInBand exited with code 0
```

Cada 0 e 1 no array representam a concorrência entre eles. 0 - Next e 1 - Jest.

Pra melhorar isso, podemos adicionar ao script o parâmetro `--names` de forma sequencial:

```js
// somente mudança parcial representada
"test": "concurrently --names next,jest 'next dev' 'jest --runInBand'"

// agora o log fica bem mais claro, com o nome de cada processo
[jest]  PASS  tests/integration/api/v1/migrations/get.test.js
[next] wait  - compiling /api/v1/status (client and server)...
[next] event - compiled successfully in 37 ms (42 modules)
[jest]  PASS  tests/integration/api/v1/status/get.test.js
[jest]
[jest] Test Suites: 3 passed, 3 total

// pra esconder um processo e nao mostrar no log, podemos adicionar o parâmetro --hide ao script
"test": "concurrently --names next,jest --hide next 'next dev' 'jest --runInBand'"
```

Pra fechar o ciclo de testes, precisamos descobrir o sinal enviado quando damos um ctrl + c pra parar o terminal

```powershell
# o echo chamando a variável de ambiente interrogação mostra o último sinal enviado para o processo
# como foi feito de forma forçada, representa um código de erro - sinal de interrupção
@thiagokj ➜ /workspaces/clone-tabnews/docs (fix-npm-test) $ echo $?
130

# precisamos de um retorno com código 0, indicando uma saída sem erro no processo.
# pra isso, podemos adicionar mais parâmetros ao script
# -k (kill others) mata outros processos
# -s command-jest (success) informa o código de saída de sucesso do comando
"test": "concurrently --names next,jest --hide next -k -s command-jest 'next dev' 'jest --runInBand'"

# log sucesso, retornando 0
[jest] Test Suites: 3 passed, 3 total
[jest] Tests:       3 passed, 3 total
[jest] Snapshots:   0 total
[jest] Time:        2.542 s, estimated 3 s
[jest] Ran all test suites.
[jest] jest --runInBand exited with code 0
--> Sending SIGTERM to other processes..
@thiagokj ➜ /workspaces/clone-tabnews/docs (fix-npm-test) $ echo $?
0

# log forçando erro, retornando 1
[jest] Test Suites: 1 failed, 2 passed, 3 total
[jest] Tests:       1 failed, 2 passed, 3 total
[jest] Snapshots:   0 total
[jest] Time:        2.529 s, estimated 3 s
[jest] Ran all test suites.
[jest] jest --runInBand exited with code 1
--> Sending SIGTERM to other processes..
```

Muito bom, mas ainda podem haver falhas. E se o servidor web não subir antes do jest? teremos falha no processo.

Sempre há uma corrida entre os processos e essa condição precisa ser `orquestrada`.

## Orchestrator

Um Orchestrator ou orquestrador é quem define a ordem de execução de cada processo.

Vamos criar o orquestrador, mas antes vamos adicionar o modulo `async-retry`.

Ele serve para ficar repetindo um comando até obter retorno.

```powershell
async-retry@1.3.3
```

```js
// criando o test/orchestrator.js
import retry from "async-retry";

// aqui teremos a sequencia de serviços subindo de forma correta para executar os testes
async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage);

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      const responseBody = await response.json();
    }
  }
}

export default {
  waitForAllServices,
};

// trecho migrations/get.test.js
import database from "infra/database";
import orchestrator from "tests/orchestrator.js";

// hook do jest indicando o primeiro método a ser executado
beforeAll(async () => {
  await orchestrator.waitForAllServices(); // método do orquestrador
  await database.query("drop schema public cascade; create schema public;");
});
```

Um exemplo forçando erros, deixando o servidor web next parado por 5 segundos, gerando timeout.

```js
// trecho do script no package.json
command-jest 'sleep 5; next dev'

// log parcial do teste

🔴 Aguardando Postgres aceitar conexões...................
🟢 Postgres está pronto e aceitando conexões!

[jest]  FAIL  tests/integration/api/v1/migrations/post.test.js (5.23 s)
[jest]   ● POST to /api/v1/migrations should return 200
[jest]
[jest]     thrown: "Exceeded timeout of 5000 ms for a hook.
[jest]     Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."
[jest]
[jest]       2 | import orchestrator from "tests/orchestrator.js";
[jest]       3 |
[jest]     > 4 | beforeAll(async () => {
[jest]         | ^
```
