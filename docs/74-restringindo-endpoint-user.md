# Travando o endpoint "/user"

Vamos usar no novo sistema de **autorização** para trancar o endpoint `/user`. Dessa forma, somente usuários ativados e com a permissão de leitura conseguem acessar suas informações.

## Ajustando os testes

Executando o `npm run test`, há uma pendencia a ser resolvida no teste:

```bash
POST /api/v1/sessions › Anonymous user › With correct `email` and correct `password`
```

É preciso ajustar o fluxo de autorização para permitir criar uma nova sessão.

## Vamos pro desafio

Após criar o usuário no teste, é criado um novo método para ativar o usuário, sem a necessidade de executar vários passos para recuperar e extrair o token novamente. Vamos pensar em **DX**, sempre ajudando e facilitando a vida de outros Dev's no projeto.

```js
// Trecho de tests/integration/api/v1/sessions/post.test.js
await orchestrator.activateUser(createdUser);

// Detalhes de implementação no orchestrator
async function activateUser(inactiveUser) {
  return await activation.activateUserByUserId(inactiveUser.id);
}
```

Simples assim! Só reaproveitamos a lógica, chamando o método do model `activation`.

## Tracando a rota user

Bem similar ao que foi feito em `/sessions`, adicionamos primeiro middleware na rota.

```js
// Trecho de pages/api/v1/user/index.js
import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

// Se o usuário tem permissão de ler sessões, ele pode acessar a rota
router.get(controller.canRequest("read:session"), getHandler);
```

Atualizando o model `activation`, para passar a permissão de leitura ao ativar o usuário:

```js
// Trecho de models/activation.js
async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}
```

E nos testes de integração ajustamos:

```js
// Trecho de tests/integration/api/v1/user/get.test.js
test("With valid session", async () => {
  const createdUser = await orchestrator.createUser({
    username: "UserWithValidSession",
  });

  // Ativa o usuário
  const activatedUser = await orchestrator.activateUser(createdUser);

  const sessionObject = await orchestrator.createSession(createdUser.id);

  const response = await fetch("http://localhost:3000/api/v1/user", {
    headers: {
      Cookie: `session_id=${sessionObject.token}`,
    },
  });

  expect(response.status).toBe(200);

  const cacheControl = response.headers.get("Cache-Control");
  expect(cacheControl).toBe("no-store, no-cache, max-age=0, must-revalidate");

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    id: createdUser.id,
    username: "UserWithValidSession",
    email: createdUser.email,
    password: createdUser.password,
    // Verifica as novas permissões
    features: ["create:session", "read:session"],
    created_at: createdUser.created_at.toISOString(),
    // Recupera a data de atualização após o usuário ser ativado
    updated_at: activatedUser.updated_at.toISOString(),
  });

  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

  // Session renewal assertions
  const renewedSessionObject = await session.findOneValidByToken(
    sessionObject.token,
  );

  expect(renewedSessionObject.expires_at > sessionObject.expires_at).toEqual(
    true,
  );
  expect(renewedSessionObject.updated_at > sessionObject.updated_at).toEqual(
    true,
  );

  // Set-Cookie assertions
  const parsedSetCookie = setCookieParser(response, {
    map: true,
  });

  expect(parsedSetCookie.session_id).toEqual({
    name: "session_id",
    value: sessionObject.token,
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    path: "/",
    httpOnly: true,
  });
});
```

Execute a bateria de testes geral com `npm test` e ajuste os pontos necessários, principalmente na parte de features, que foram alteradas.

```js
// Novo grupo de teste criado em tests/integration/api/v1/user/get.test.js
// Testando um acesso sem estar logado.
describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const response = await fetch("http://localhost:3000/api/v1/user");

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });
  });
});
```

## Criando o teste para recuperar informações do usuário

```js
// Trecho de tests/integration/_use-cases/registration-flow.test.js
test("Get user information", async () => {
  const userResponse = await fetch("http://localhost:3000/api/v1/user", {
    headers: {
      cookie: `session_id=${createSessionsResponseBody.token}`,
    },
  });

  expect(userResponse.status).toBe(200);

  const userResponseBody = await userResponse.json();

  expect(userResponseBody.id).toBe(createUserResponseBody.id);
});
```

Log dos testes passando:

```bash
[jest] Test Suites: 12 passed, 12 total
[jest] Tests:       35 passed, 35 total
```
