# Injeção de Middlewares

Primeiro, vamos implementar o teste de login. Nada de novo por aqui, apenas cria uma sessão ao se logar.

```js
test("Login", async () => {
  const createSessionsResponse = await fetch(
    "http://localhost:3000/api/v1/sessions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "registration.flow@curso.dev",
        password: "RegistrationFlowPassword",
      }),
    },
  );

  expect(createSessionsResponse.status).toBe(201);

  const createSessionsResponseBody = await createSessionsResponse.json();

  expect(createSessionsResponseBody.user_id).toBe(
    createSessionsResponseBody.id,
  );
});
```

Agora vamos implementar de uma forma que sempre será injetado no topo de qualquer controller um usuário, seja ele **anonimo** ou **autenticado**.

Dessa forma, conseguimos recuperar as features do usuário antes para permitir ou não sua autorização, sobre qualquer rota.

## Middleware

O `Middleware` é mais um conceito. É como um software que fica no Middle (meio) entre duas coisas. Sendo uma função tradicional que identifica melhor o objetivo de interceptar o fluxo entre duas etapas.

É quase a mesma coisa quando falamos na diferença entre método e função. Chamamos de método uma função que participa de um objeto, model ou classe.

```js
// Trecho de pages/api/v1/sessions/index.js
import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";

const router = createRouter();

// Aqui nos usamos o middleware do next-connect
router.use(PassamosUmaFuncaoAqui);
// Demais códigos...
```

Então vamos criar uma função para entender mais sobre o conceito, trazendo logs na console

```js
router.use(testeDeLog);

// Middleware executado antes de qualquer handler.
// Recebe request, response e next.
// 'next()' deve ser chamado para continuar o fluxo e passar para o próximo middleware ou rota.
function testeDeLog(request, response, next) {
  console.log("\n");
  console.log("Hora:", new Date().toISOString());
  console.log("Path:", request.method, request.url);
  console.log("\n");
  next();
}

// Log na console
// Hora: 2025-10-28T17:06:11.495Z
// Path: POST /api/v1/sessions
```

O `next()` continua a execução da pilha de middlewares. Forçando um erro simulado com senha errada.

```js
function testeDeLog(request, response, next) {
  console.log("\n");
  console.log("Hora:", new Date().toISOString());
  console.log("Path:", request.method, request.url);
  request.body.password = "senhaerrada";
  console.log("\n");
  return next();
}

// Erro no console
Use case: Registration Flow (all successful) › Login

expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 401

103 |  expect(createSessionsResponse.status).toBe(201);
105 |  const createSessionsResponseBody = await createSessionsResponse.json();
```

Então conseguimos capturar com sucesso o que foi passado na entrada, na requisição do controller.

O que fizemos aqui: Injetamos um contexto dentro do objeto request que também será carregado de um lugar para outro.

Exemplo: Injetar um usuário anônimo ou um usuário autenticado.

## Separando em outra camada

Fazer a separação é essencial para os handlers permanecerem limpos. Assim, só precisamos informar o contexto para usar de forma bem flexível.

Aqui poderiamos delegar a injeção para a model de autenticação.

```js
router.use(authentication.injectAnonymousOrUser);
```

Porém, seria necessário refatorar o mesmo para lidar com o protocolo HTTP. Por definições e escolhas do curso, centralizamos a parte de lidar com http diretamente na infra, no controller.js.

```js
// Trecho de infra/controller.js
async function injectAnonymousOrUser(request, response, next) {
  // 1. Se o cookie `session_id` existe, injetar usuário.
  // 2. Se não, injeta usuário anonimo.
}
```

Então temos a seguinte implementação da função para injetar o usuário autenticado:

```js
// Trecho de infra/controller.js
async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  // primeiro são recuperados outros contextos já passados utilizando o spread
  // sem sobrescrever o middleware. Assim espalhamos as propriedades passadas anteriormente
  request.context = {
    ...request.context,
    user: userObject,
  };
}
```

Por último, implementando a injeção do usuário anonimo, espalhando primeiro qualquer outro contexto existente na request:

```js
// Trecho de infra/controller.js
function injectAnonymousUser(request) {
  // Permissões padrão do usuário anonimo.
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}
```

> [!TIP]
>
> Utilize o console.log(request.context) para acompanhar no console os dados de contexto.

Exemplo:

```js
// Trecho de pages/api/v1/sessions/index.js
async function postHandler(request, response) {
  console.log(request.context);
  const userInputValues = request.body;
  // Demais códigos
}

// Saída no console
 ✓ Compiled /api/v1/sessions in 49ms (85 modules)
{
  user: {
    features: [ 'read:activation_token', 'create:session', 'create:user' ]
  }
}
 POST /api/v1/sessions 201 in 69ms
```

## Autorização nos Handlers

Vamos adicionar um parâmetro que inclui a verificação antes de executar nossos handlers. Assim só será permitida a execução caso o usuário tenha a permissão.

```js
// Trecho de pages/api/v1/sessions/index.js
// Aqui passamos uma função de alta ordem.
router.post(controller.canRequest("create:session"), postHandler);
// Demais códigos...
```

Veja como ficou bem declarativo e expressivo o texto: "Se o controller pode fazer a requisição com a permissão de criar a sessão, ele vai pro postHandler".

Essa função `canRequest` é só uma **"casquinha"**, ou seja, o que vale é o miolo dela. A sua implementação é bem similar ao que foi feito na função `testeDeLog`.

```js
// Trecho de infra/controller.js
// Trazendo os logos para console
function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    console.log("feature:", feature);
    console.log("request:", request.method, request.url);
    console.log("user:", request.context.user);

    return next();
  };
}

// Saída
// Dados do usuário anônimo injetado
feature: create:session
request: POST /api/v1/sessions
user: {
  features: [ 'read:activation_token', 'create:session', 'create:user' ]
}
 POST /api/v1/sessions 201 in 16ms
```

Agora implementando com a lógica real:

```js
function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    // Se o usuário que está tentando fazer a requisição
    // possui a permissão, pode prosseguir.
    if (userTryingToRequest.features.includes(feature)) {
      return next();
    }

    // Se não, lança erro de proibição.
    throw new ForbiddenError({
      message: "Você não possui permissão para executar essa ação.",
      action: `Verifique se o seu usuário possui a feature "${feature}"`,
    });
  };
}
```

## Lançando exceção de proibição

Criando o erro customizado de proibição:

```js
// Trecho de infra/errors.js
export class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Acesso negado.", {
      cause,
    });
    this.name = "ForbiddenError";
    this.action =
      action || "Verifique as features necessárias antes de continuar.";
    this.statusCode = 403;
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
```

Atualizando a lógica de tratamento de erros:

```js
// Trecho de infra/controller.js
// Adiciona o ForbiddenError como um erro normal
function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }
  // Demais códigos ...
}
```

## Testando a remoção da feature

Vamos testar, removendo temporariamente a permissão do usuário anônimo de criar sessão 😃.

```js
// Trecho de infra/controller.js
// removido "create:session"
function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:user"],
  };
}

// Saída do teste no console
// Veja que veio o 403 - Proibido
✕ Login (37 ms)
  ✓ Get user information (1 ms)

  ● Use case: Registration Flow (all successful) › Login

    expect(received).toBe(expected) // Object.is equality

    Expected: 201
    Received: 403
```

É isso ai! Estamos bem perto do model Authorization, apenas extrair a lógica e extender ela. O próximo passo será checar se o **usuário alvo**, o que é o detentor do email e senha, possui a feature de criar sessões.
