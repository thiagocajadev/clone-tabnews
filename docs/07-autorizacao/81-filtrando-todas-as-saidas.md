# Filtrando todas as saídas

Continuando o processo de filtrar os dados sensíveis, devolvendo na resposta da request.

```js
// Trecho de models/authorization.js
// Melhorando a descrição do output para resource
function filterOutput(user, feature, resource) {
  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
```

Depois de atualizar o usuário, eu quero "ler" o objeto do usuário, por isso a permissão `read:user` é devolvida no retorno do endpoint.

```js
// Trecho de pages/api/v1/users/[username]/index.js
const secureOutputValues = authorization.filterOutput(
  userTryingToPatch,
  "read:user",
  updatedUser,
);
```

Atualizando a criação de usuário e removendo o retorno do email e senha nos testes:

```js
// Aplicando a lógica de filtro no endpoint users
// Trecho de pages/api/v1/users/index.js
async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
```

```js
// Trecho de tests/integration/api/v1/users/post.test.js
expect(responseBody).toEqual({
  id: responseBody.id,
  username: "thiagocajadev",
  features: ["read:activation_token"],
  created_at: responseBody.created_at,
  updated_at: responseBody.updated_at,
});
```

E o mesmo ajuste no fluxo de registro do usuário

```js
// Trecho de tests/integration/_use-cases/registration-flow.test.js
expect(createUserResponseBody).toEqual({
  id: createUserResponseBody.id,
  username: "RegistrationFlow",
  features: ["read:activation_token"],
  created_at: createUserResponseBody.created_at,
  updated_at: createUserResponseBody.updated_at,
});
```

## Olhando sobre o endpoint sensível `/user`

Aplicando o filtro para a permissão do usuário ler ele mesmo:

```js
// Trecho de pages/api/v1/user/index.js
const secureOutputValues = authorization.filterOutput(
  userTryingToGet,
  "read:user:self",
  userFound,
);
```

Adicionando uma dupla conferência para dar a segurança que é o mesmo usuário que está vendo a si próprio:

```js
// Trecho de models/authorization.js
if (feature === "read:user:self") {
  if (user.id === resource.id) {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
}
```

E ai é só ajustar os testes quebrados, removendo os campos de email e senha.

## Pesquisando os endpoints fora do padrão

Quem ainda não está usando filtro de saída? Vamos usar regex para pesquisar.

```js
// Usando Ctrl + Shift + f, habilitando regex na busca, fazemos um match invertido
// procurando os endpoints que não usam filtro de saída
// Em files to include, olhe apenas dentro de pages/api
\.json\((?!secureOutputValues\))
```

Aqui temos o retorno de 7 endpoints, vamos focar nos endpoints de ativação e sessão

## Ajustando o endpoint sessions

```js
// Trecho de pages/api/v1/sessions/index.js
const secureOutputValues = authorization.filterOutput(
  authenticatedUser,
  "read:session",
  newSession,
);

return response.status(201).json(secureOutputValues);
```

E no model `authorization` criamos um novo seguimento para checar a permissão `read:session`.

```js
// Trecho de models/authorization.js
// Mais uma dupla checagem, para ficar seguro que o usuário de leitura é o vinculado
if (feature === "read:session") {
  if (user.id === resource.user_id) {
    return {
      id: resource.id,
      token: resource.token,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }
}
```

Aplicando a mesma logica pro `DeleteHandler`

```js
// Trecho de pages/api/v1/sessions/index.js
const secureOutputValues = authorization.filterOutput(
  userTryingToDelete,
  "read:session",
  expiredSession,
);

return response.status(200).json(secureOutputValues);
```

Tudo ok!

## Ajustando o endpoint `Activations`

Agora só aplicar a mesma lógica no `PatchHandler` para o filtro de saída.

```js
// Trecho de pages/api/v1/activations/[token_id]/index.js
const secureOutputValues = authorization.filterOutput(
  userTryingToPatch,
  "read:activation_token",
  usedActivationToken,
);

return response.status(200).json(secureOutputValues);
```

E no model `authorization`, abrimos mais um segmento para especificar o retorno para essa feature

```js
// Trecho de models/authorization.js
if (feature === "read:activation_token") {
  return {
    id: resource.id,
    user_id: resource.user_id,
    created_at: resource.created_at,
    updated_at: resource.updated_at,
    expires_at: resource.expires_at,
    used_at: resource.used_at,
  };
}
```

Fechou! Agora na próxima parte, vamos para desafio: bloquear o endpoint `/migrations` e filtrar dados específicos no endpoint `/status` no caso de um usuário com acesso privilegiado.
