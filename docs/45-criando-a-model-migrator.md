# O que é um Model no MVC

Nesse projeto, o foco até o momento foi começar a fundação desenvolvendo a infraestrutura. E como não houve uma separação em camadas, a infra acaba misturada em trechos de código, gerando duplicidade e necessidade de modificação em vários locais.

No Controller `/migrations`, temos detalhes de implementação com a infra necessária pra rodar as migrations.

Então, pra fazer essa separação dos detalhes de implementação, criamos um **Model**, que é um **molde** para representar virtualmente algo do mundo real. Exemplos:

- Representar um ou vários usuários, criando um Model **User**.
- Representar um ou vários carros, criando um Model **Car**.
- Representar uma ou várias contas bancárias, criando um Model **BankAccount**.

Aproveitando o exemplo do modelo de usuário, quais as informações representam um usuário que são importantes para uso em um sistema? Nome do usuário (apelido), email, nome completo... essas propriedades identificam um usuário, diferenciando de qualquer outro.

O model pode representar qualquer coisa virtual, atendendo qualquer outra necessidade virtual. Então dentro de um Model usuário, temos os dados que representam o usuário como e-mail e apelido, além de possuir **ações**, que são escritas como um método `atualizaEmail()`.

Os métodos ou funções dentro de um model tem as definições de quais **regras** precisam ser atendidas para que alguma ação seja realizada. É dai que vem o termo **Regras de Negócio**. No MVC isso fica dentro do Model, pra não haver riscos de implementar uma regra importante duas ou mais vezes no sistema, evitando espalhar a lógica em Controllers.

Conforme os requisitos mudam ou evoluem em um sistema, se a lógica não fica centralizada e organizada, os serviços começam a ficar inconsistentes.

Ex: uma função para verificar se um email existe, **isEmailRegistered(userEmail)**. Ela pode ser usada na criação de um novo usuário, ao atualizar um cadastro, ao fazer uma integração com um serviço externo, entre outros.

E o que teria dentro de um método de verificação de email?

```js
// uma comparação de o email existe
"usuario@email" === "Usuario@email"; // pro sistema isso é false

// mas sabemos que é o mesmo email, não pode ser criado
"usuario@email".toLowerCase() === "Usuario@email".toLowerCase(); // agora sim é true
```

Resumindo:

Um **Model User** representa um **Usuário**. Os **Dados do Usuário** são as **Propriedades**. As **Ações** que o Usuário pode realizar são os **Métodos** ou **Funções**.

## Criando a model Migrator

Hoje a lógica com detalhes de implementação das migrations estão espalhadas no Orchestrator e no endpoint /migrations. O ideal é abstrair esses detalhes, centralizando e organizando com a criação de um **Model Migrator**

O pensamento aqui deve ser: qual é o papel de cada parte do código em uma organização estruturada? Qual trecho de código faz sentido estar no Model, no Controller e na View? Respondendo a essas perguntas, sempre chegamos mais perto do ideal.

```js
// criado o migrator.js, dentro do diretório models
// refatorando com base no endpoint /migrations

// esse trecho faz sentido estar no model, pois as propriedades estão nesse objeto
const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

// agora as ações, tem muita infra misturada aqui
// request e response são responsabilidades do Controller, no tratamento
// de uma requisição
async function getHandler(request, response) {
  let dbClient;

  try {
    // conexão com o banco é responsabilidade de infra
    dbClient = await database.getNewClient();

    // Runner é responsabilidade de infra
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return response.status(200).json(pendingMigrations);
    // mais uma responsabilidade de infra
  } finally {
    await dbClient.end();
  }
}
```

É necessário separar o que é **Infra** do que é **Funcionalidade**.

```js
// em um primeiro nível, refatorando a função pra ela ficar mais pura
// com menos dependências de infra, mais focada na funcionalidade
// retornando uma lista com as migrações pendentes
async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pendingMigrations;
  } finally {
    await dbClient.end();
  }
}
```

Então para permitir utilizar utilizar essa função em outros locais no código, exportando o **listPendingMigrations**

```js
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

// exportando o código pra fora do Model
const migrator = {
  listPendingMigrations,
};

export default migrator;
```

E fazendo a limpeza do código no endpoint **/migrations**.

```js
import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

// agora a função ficou menor, mais limpa e com apenas a sua responsabilidade
async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}
```

Show! Seguindo a mesma lógica para separar e refatorar o `postHandler`.

```js
// migrator.js
async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return migratedMigrations;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

// endpoint /migrations
// agora com a responsabilidade de apenas chamar o método
// para rodar as migrações
async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}
```
