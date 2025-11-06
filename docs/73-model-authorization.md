# Model Authorization

Esse é um model muito especial, onde passamos o usuário, o perfil e o recurso a ser acessado, configurando toda a inteligência para permitir ou não o acesso.

> [!TIP] Uma boa prática por padrão é restringir todos os acessos, liberando somente o necessário conforme o contexto de acesso.

Em qualquer lugar da aplicação que você queria verificar a permissão, teremos algo como:

```js
if (authorization.can()) {
  return next();
}
```

A vantagem é que ele não está acoplado ao `HTTP`, ele não conhece de infra, sendo bem mais flexível.

```js
// Se o usuário envolvido tiver o perfil, volta um booleano true. Se não, volta false.
if (authorization.can(userTryingToRequest, feature)) {
  return next();
}
```

## Criando o authorization.js

Inicialmente, temos o model assim, checando o usuário e o perfil:

```js
// Trecho de models/authorization.js
function can(user, feature) {
  let authorized = false;

  // Se o usuário possui o perfil, libera o acesso.
  if (user.features.includes(feature)) {
    authorized = true;
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
```

## Refatorando o endpoint `/sessions`

Primeiro, vamos simular que o usuário não tem nenhuma feature atribuída.

```js
// Trecho de infra/controller.js
async function activateUserByUserId(userId) {
  // const activatedUser = await user.setFeatures(userId, ["create:session"]);
  const activatedUser = await user.setFeatures(userId, []);
  return activatedUser;
}

// Ele não consegue ativar sua conta, porem ainda continua seguindo com o login
// Saída no console
id: '382a6d0a-e0c2-432f-9df6-48bad21263df',
username: 'RegistrationFlow',
email: 'registration.flow@curso.dev',
created_at: 2025-10-31T16:28:16.220Z,
updated_at: 2025-10-31T16:28:16.308Z,
features: []
```

Para evitar esse comportamento, é necessário tratar:

```js
// Trecho de pages/api/v1/sessions/index.js
async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  // Adicionada verificação no perfil antes de fazer o login
  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }
  // Demais códigos...
}
```

E agora sim, o login é bloqueado pelo endpoint `/sessions`, retornando 403 - Proibido:

```bash
FAIL  tests/integration/_use-cases/registration-flow.test.js (42.796 s)
  Use case: Registration Flow (all successful)
    ✓ Create user account (243 ms)
    ✓ Receive activation email (13 ms)
    ✕ Activate account (56 ms)
    ✕ Login (52 ms)
    ✓ Get user information

  ● Use case: Registration Flow (all successful) › Activate account
    Expected: 201
    Received: 403
```
