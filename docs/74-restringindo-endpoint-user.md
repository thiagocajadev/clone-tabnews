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
