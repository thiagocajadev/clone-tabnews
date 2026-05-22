# Filtrando a saída

Se você não definir o formato dado que está entrando e saindo da sua API, os hackers vão definir isso por você! 🥸🕵🏻‍♂️

Chegou a hora de controlar o `I/O`, input e output do nosso sistema de forma simples, filtrando num primeiro momento.

E vamos entender algumas diferenças aqui, quanto a abordagens comuns, pois são vários níveis em que podemos nos aprofundar, mas começando com termos bem usados:

- **Validação:** verifica se o dado é válido. Passa ou falha.
- **Filtro:** decide o que entra ou sai. Remove o que não interessa.
- **Coerção:** força o dado para um tipo/formato esperado.
- **Normalização:** padroniza o dado para um formato consistente.
- **Sanitização:** remove ou neutraliza conteúdo perigoso.

Então, vamos começar pelo **filtro de saída**. Estamos devolvendo a senha nas respostas aos usuários! E isso é um caos!!! 😅

Executando teste:

```bash
# Match com tests/integration/api/v1/users/[username]/get.test.js
npm run test:watch username./get
```

## Criando um Raios-X

Pense como se fosse um sensor de loja ou um detector de Raios-X de aeroporto. Nada ilícito pode passar! Imagina uma faca ou arma passar, jamais!

```js
// Trecho de pages/api/v1/users/[username]/index.js
async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  // Veja esse retorno, traz o objeto completo do usuário, inclusive sua senha
  // um prato cheio para um hacker roubar dados!
  return response.status(200).json(userFound);
}
```

Nunca devemos aceitar o input padrão e retornar o objeto original do banco de dados. Toda request e response precisa ser filtrada, precisa ser tratada para trafegar somente os dados permitidos.

```js
// Refatorando pages/api/v1/users/[username]/index.js
async function getHandler(request, response) {
  // Recuperamos o usuário que está tentando fazer o GET
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  // Delegamos a saída segura para o filtro dentro de authorization.
  // A assinatura do método solicita o usuário, permissão e saída
  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  // E agora sim, a saída com dados seguros, filtrados para evitar vazamento
  // de informações sensíveis.
  return response.status(200).json(secureOutputValues);
}
```

Vamos pra implementação do `filterOutput`:

```js
// Trecho de models/authorization.js
function filterOutput(user, feature, output) {
  // Se a permissão é de leitura de usuário,
  // retorna o objeto apenas com os campos seguros.
  if (feature === "read:user") {
    return {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  }
}
```

E agora o teste irá quebrar, pois os campos de email e senha não retornam mais.

```js
- Expected  - 2
+ Received  + 0
Object {
  "created_at": "2026-01-28T11:33:37.373Z",
-   "email": "Raymond65@hotmail.com",
  "features": Array [
    "read:activation_token",
  ],
  "id": "0ff69eff-9143-4b0f-99c6-35950b6edccb",
-   "password": undefined,
  "updated_at": "2026-01-28T11:33:37.373Z",
  "username": "CaseDiferente"
}
```

Então, podemos retirar dos testes essas duas propriedades.

## Desafio

Agora é a hora do desafio: aplicar o filtro de saída no método PATCH.

Habilitando os testes para darem match no método `patch`:

```bash
npm run test:watch username./patch
```

Refatoração do método `patchHandler`, seguindo a didática do desafio:

```js
// Trecho de tests/integration/api/v1/users/[username]/patch.test.js
async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  // Passando ao filtro o usuário atualizado
  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "update:user",
    updatedUser,
  );

  // Devolvendo apenas o retorno seguro, similar ao que fizemos no getHandler
  return response.status(200).json(secureOutputValues);
}
```

Detalhes de implementação do authorization:

```js
function filterOutput(user, feature, output) {
  if (feature === "read:user") {
    return {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  }

  // Nova condicional comparando a permissão de atualização de usuário
  if (feature === "update:user") {
    return {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  }
}
```

Por fim, ajustados os testes, removendo as informações de `email`e `senha`.

```js
// Trecho de tests/integration/api/v1/users/[username]/patch.test.js
expect(responseBody).toEqual({
  id: defaultUser.id,
  username: "AlteradoPorPrivilegiado",
  features: defaultUser.features,
  created_at: responseBody.created_at,
  updated_at: responseBody.updated_at,
});
```

É isso ai!
