# 🪪 Autenticação e Autorização - Parte 2

Desmistificando Cookies e Sessões: São apenas textos salvos em algum lugar, seja um arquivo, banco de dados ou memória.

Criando a tabela `sessions` no banco via Migrations:

```bash
# script seguindo convenção de nomes
npm run migrations:create create sessions
```

## Preenchendo a migration:

```js
exports.up = (pgm) => {
  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // inspirado no tamanho de token do facebook
    token: {
      type: "varchar(96)",
      notNull: true,
      unique: true,
    },

    // Por padrão, referência para chave estrangeira (FK) busca a coluna ID da tabela.
    // No caso da tabela users fica: references: "users" -> users.id
    user_id: {
      type: "uuid",
      notNUll: true,
      references: "users",
    },

    // For reference, https://justatheory.com/2012/04/postgres-use-timestamptz/
    expires_at: {
      type: "timestamptz",
      notNull: true,
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
```

Esse migration de exemplo levanta uma polemica sobre o uso de chaves estrangeiras. Nesse projeto não será usado. Assim como o GitHub não usa FKs, nem o Pagar.me, TabNews e outros projetos.

### Quando considerar **não usar FKs**:

- Você tem controle total via **validação de aplicação** (bem testada).
- Arquitetura **distribuída/microserviços**.
- **Performance extrema** é prioridade.
- A equipe sabe o que está fazendo e tem processos sólidos de **QA e validação**.

### Quando usar **FKs com força**:

- Sistema **monolítico tradicional**.
- Banco **relacional centralizado**.
- **Equipe pequena** ou risco de **inconsistência alto**.
- **Dados críticos** (financeiros, médicos, etc).

## Model Session

Aqui, atualizamos as propriedades e regras de negócio do model.

```js
// models/session.js
import crypto from "node:crypto";
import database from "infra/database.js";

// variável para calcular o tempo de expiração do token
const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days

async function create(userId) {
  // Token gerado como hexadecimal usando módulo crypto do node.
  // O randomBytes gera pares de valores. Então 48 * 2 = 96,
  // que é o tamanho do campo token na tabela sessions.
  const token = crypto.randomBytes(48).toString("hex");

  // Pega a data atual e acrescenta 30 dias
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  // A boa prática de abstração, com a criação e retorno
  // de uma nova sessão logo nas primeiras linhas do código.
  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  // Detalhes da implementação do método que faz insert na tabela de sessões
  // vem abaixo.
  // Pra retornar os valores inseridos no Postgres,
  // é adicionado ao final da consulta o RETURNING.
  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });

    // Retorna apenas o 1º registro, na posição 0.
    return results.rows[0];
  }
}

// Exporta os métodos e também variáveis
const session = {
  create,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
```

## Testes na rota /sessions

Vou deixar de exemplo apenas um dos testes mais completos aqui e que no futuro deverá ser alterado. A questão dos milissegundos pode gerar problemas no caso de virada de horários(Ex: 23:59 -> 00:00).

Isso afeta logs e o CI, deixar assim servirá para didática do projeto. Uma forma de evitar a questão de registro de horários seria tratar zerando horas, minutos e segundos. Assim a geração de registros ficaria mais consistente.

```js
// api/v1/sessions/post.test.js
// POST /api/v1/sessions
test("With correct `email` and correct `password`", async () => {
  const createdUser = await orchestrator.createUser({
    email: "tudo.correto@curso.dev",
    password: "tudo.correto",
  });

  const response = await fetch("http://localhost:3000/api/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "tudo.correto@curso.dev",
      password: "tudo.correto",
    }),
  });

  // Assertion, esperando que o registro seja criado -> código 201
  expect(response.status).toBe(201);

  // Recupera o retorno do corpo da requisição no formato JSON
  const responseBody = await response.json();

  // Espera o retorno de um JSON com a estrutura preenchida
  expect(responseBody).toEqual({
    id: responseBody.id,
    token: responseBody.token,
    user_id: createdUser.id,
    expires_at: responseBody.expires_at,
    created_at: responseBody.created_at,
    updated_at: responseBody.updated_at,
  });

  // Assertions validando as informações preenchidas no corpo da resposta
  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

  // Tratamento zerando milissegundos para comparar as datas de criação e expiração,
  // verificando se o período é o que foi definido na variável EXPIRATION_IN_MILLISECONDS.
  const expiresAt = new Date(responseBody.expires_at);
  const createdAt = new Date(responseBody.created_at);

  expiresAt.setMilliseconds(0);
  createdAt.setMilliseconds(0);

  expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);
});

// Log no console, com um JSON de exemplo retornado
{
  id: 'b87ad9af-b790-46a0-bd1a-2044a4a3f82e',
  token: 'fff9d8a2d2cbe7a32cf4b5d9ef83b5d0c1fa2...', // 96 caracteres
  user_id: '9954dbb7-2135-47bb-ba1b-95845d03a43a',
  expires_at: '2025-08-31T13:33:35.436Z',
  created_at: '2025-08-01T13:33:35.440Z',
  updated_at: '2025-08-01T13:33:35.440Z'
}
```
