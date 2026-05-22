# Criando uma rota dinâmica

Criar um rota dinâmica permite a passagem de parâmetros diretamente na rota (segmento dinâmico). Isso habilita o uso de uma rota como `/api/v1/users/[username]`, onde o parâmetro **username** será sempre um valor informado, um valor **coringa**. Ex: `/api/v1/users/thiagocajadev`.

```js
// crie uma pasta no diretório pages usando colchetes.
// Assim o NextJs irá fornecer a rota de forma dinâmica
// pages/api/v1/users/[username]/index.js
import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  // api/v1/users/[username]
  // api/v1/users/ThiagoCajaDev
  // para recuperar o valor informado na rota, usamos o request.query
  // todos os parâmetros são disponibilizados com o mesmo nome que está entre colchetes.
  request.query.username;
  return response.status(200).json({});
}
```

Então basicamente essa rota deve retornar um único usuário. Bora criar a lógica pra isso.

```js
// api/v1/users/[username]/index.js
// outros códigos acima...
async function getHandler(request, response) {
  // recupera o nome de usuário que veio na rota
  const username = request.query.username;
  // consulta no banco se esse nome de usuário existe
  const userFound = await user.findOneUserByUsername(username);
  return response.status(200).json(userFound);
}

// models/user.js
async function findOneUserByUsername(username) {
  // método interno para organização do código
  // essa forma fazer a operação e retornar no início do código
  // deixa o entendimento mais legível e simples
  const userFound = await runSelectQuery(username);
  return userFound;

  // consulta no banco, limitando apenas 1 registro
  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [username],
    });

    // caso retorne 0 registros (nenhum registro), lança erro de não encontrado
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente,",
      });
    }

    // o retorno sempre é uma lista de linhas com registros
    // posição 0 é o primeiro registro da lista
    return results.rows[0];
  }
}

// infra/errors.js
// detalhes do tratamento de erro NotFoundError
// similar ao ValidationError
export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Não foi possível encontrar esse recurso no sistema.", {
      cause,
    });
    this.name = "NotFoundError";
    this.action =
      action ||
      "Verifique se os parâmetros enviados na consulta estão corretos.";
    this.statusCode = 404;
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

// infra/controller.js
// adicionado erro ao Controller
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
} from "infra/errors";

// condição de tratamento de erro ajustada
function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.log(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}
```
