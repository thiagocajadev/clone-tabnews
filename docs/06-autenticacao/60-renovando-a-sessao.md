# 🔄 Renovando a Sessão

Antes de sair programando. Pense de forma abstrata. Pense em como ir encaixando peça por peça na hora de desenvolver uma API.

Abstrações para interfaces são ótimas para atender diversas possibilidades
Pense na API e os dados que ela pode fornecer. Quem vai se conectar depois? Pode ser qualquer client: Web, Celular, Desktop.

Se focar também apenas no que vai ser entregue ali no contexto também é válido. Fazer algo simples e sofisticado, atendendo a demanda. Crie uma arquitetura bacana na imaginação.

## Refatorando os Endpoints

Primeiro é organizado o fluxo para recuperar a sessão do usuário

```js
// pages/api/v1/user/index.js
async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  // organizando o fluxo de recuperar a sessão válida e renovar a mesma
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);
  return response.status(200).json(userFound);
}
```

Depois no endpoint que cria a sessão, é reaproveitado o uso do `setSessionCookie`

```js
// pages/api/v1/sessions/index.js
async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  // aqui a lógica foi centralizada na infra, pois é algo usado somente no protocolo http
  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}
```

## Refatorando o Controller

```js
// infra/controller.js
// com esse método centralizado aqui, há uma menor repetição de código
// deixando a aplicação clean
async function setSessionCookie(sessionToken, response) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}
```

## Refatorando o Model `sessions`

```js
// models/session.js
async function renew(sessionId) {
  // A data de expiração estava sendo usada em 2 locais, então foi criado um método
  // para deixar o código limpo
  const expiresAt = getExpirationDate();

  const renewedSessionObject = runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}
```

## Testando a sessão quase expirada

Todo o processo foi feito com o teste sendo executado, direcionando a escrita do código. Abaixo o resumo do teste que utiliza as regras de negócio implementadas:

```js
test("With almost expired session", async () => {
  const createdUser = await orchestrator.createUser({
    username: "UserWithAlmostExpiredSession",
  });

  console.log("Novo usuário criado: ", createdUser);

  const FAKE_29_DAYS_AGO = 60 * 60 * 24 * 29 * 1000;

  jest.useFakeTimers({
    now: new Date(Date.now() - FAKE_29_DAYS_AGO),
  });

  const sessionObject = await orchestrator.createSession(createdUser.id);

  console.log("Nova sessão criada simulando 1 dia restante: ", sessionObject);

  const response = await fetch("http://localhost:3000/api/v1/user", {
    headers: {
      Cookie: `session_id=${sessionObject.token}`,
    },
  });

  const parsedResponseSetCookie = setCookieParser(response, {
    map: true,
  });

  let sessionInfo = parseSessionCookieExpiry(parsedResponseSetCookie);

  console.log("Token da sessão criada: ", sessionInfo);

  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    id: createdUser.id,
    username: "UserWithAlmostExpiredSession",
    email: createdUser.email,
    password: createdUser.password,
    created_at: createdUser.created_at.toISOString(),
    updated_at: createdUser.updated_at.toISOString(),
  });

  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

  // Session renewal assertions
  const renewedSessionObject = await session.findOneValidByToken(
    sessionObject.token,
  );

  console.log("Sessão renovada: ", renewedSessionObject);

  expect(renewedSessionObject.expires_at > sessionObject.expires_at).toEqual(
    true,
  );
  expect(renewedSessionObject.updated_at > sessionObject.updated_at).toEqual(
    true,
  );

  jest.useRealTimers();

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

  sessionInfo = parseSessionCookieExpiry(parsedResponseSetCookie);

  console.log("Token da sessão renovada: ", sessionInfo);

  function parseSessionCookieExpiry(parsedCookie) {
    const { name, value, maxAge } = parsedCookie.session_id;

    const expiresDate = new Date(Date.now() + maxAge * 1000);
    expiresDate.setMilliseconds(0);

    const maxAgeInDateISO = expiresDate.toISOString();

    return {
      name,
      value,
      maxAge,
      maxAgeInDateISO: maxAgeInDateISO,
    };
  }
});
```
