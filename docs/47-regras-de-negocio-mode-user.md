# Definindo regras de negócio no Model

Primeiro, vamos testar o cadastro de email duplicado.

```js
test("With duplicated 'email'", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "emailduplicado1",
      email: "duplicado@curso.dev",
      password: "senha123",
    }),
  });

  expect(response1.status).toBe(201);

  const response2 = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "emailduplicado2",
      email: "Duplicado@curso.dev",
      password: "senha123",
    }),
  });

  expect(response2.status).toBe(400);
});
```

log no console

```bash
 FAIL  tests/users/post.test.js
  POST /api/v1/users
    Anonymous user
      ✓ With unique and valid data (64 ms)
      ✕ With duplicated 'email' (23 ms)
```

Agora é a hora de criar a regra para validação de email no model user.

```js
// refatorando o models/user.js
// trecho da validação de email
async function validateUniqueEmail(email) {
  // aqui normalizamos o email para fazer a comparação
  // passando todos os caracteres para minúsculo
  const results = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  // se a consulta retornar registros, lança o erro personalizado
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar o cadastro.",
    });
  }
}
```

> O Model não se importa com quem está fazendo requisições e chamando ele.
> Ele nem sabe o que é uma requisição, se é um script do orchestrator, etc.

Trabalhar com uma arquitetura em camadas nos permite desacoplar, separar a lógica, tornando as **regras apáticas** ao que vem de fora, se importando apenas com o seu único propósito.

Alguns frameworks permitem escolher o objeto de retorno e cada implementação pode ser feita de outra forma, para atender melhor uma questão do negócio.

Nesse caso aqui, para expor na interface publica, foi definido assim, lançando um erro. 😃

A vantagem dessa abordagem é que se encaixa com a abstração do **onError** ao passar pelo **Controller**, tendo toda a gestão de erros encadeados.

```js
// detalhes do ValidationError em infra/erros.js
// similar ao ServiceError
export class ValidationError extends Error {
  // aqui retornamos adicionamos o retorno da action com fallback
  constructor({ cause, message, action }) {
    super(message || "Um erro de validação ocorreu.", {
      cause,
    });
    this.name = "ValidationError";
    this.action = action || "Ajustes os dados enviados e tente novamente.";
    this.statusCode = 400;
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

// ajuste em infra/controller.js
function onErrorHandler(error, request, response) {
  // um erro de validação é algo mais leve e fácil de retornar
  // para o cliente que está fazendo a requisição
  if (error instanceof ValidationError) {
    return response.status(error.statusCode).json(error);
  }

  // o InternalServerError deve ser o último recurso a ser retornado
  // pois aqui vem toda stacktrace de erro
  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
}
```
