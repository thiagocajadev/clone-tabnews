# Enviando email de ativação

O primeiro ponto é continuar praticando o TDD, criando os testes seguindo o fluxo de registro.

```js
// trecho de tests/integration/_use-cases/registration-flow.test.js
test("Receive activation email", async () => {
  const lastEmail = await orchestrator.getLastEmail();

  expect(lastEmail.sender).toBe("<contato@thiagocaja.dev>");
  expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
  expect(lastEmail.subject).toBe("Ative seu cadastro no FinTab!");
  expect(lastEmail.text).toContain("RegistrationFlow");
});
```

Agora testando o fluxo:

```bash
npm run test:watch --registration-flow.test.js

# Saída no terminal. O id do último email está indefinido.
  ● Use case: Registration Flow (all successful) › Receive activation email
    TypeError: Cannot read properties of undefined (reading 'id')

    77 |
    78 |   const emailTextResponse = await fetch(
  > 79 |     `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`)
```

Precisamos recuperar o `id` do último email. Primeiro, vamos ajustar o método que retorna

```js
// trecho de tests/orchestrator.js
async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  // Caso não encontre o email, retorna nulo.
  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );

  const emailTextBody = await emailTextResponse.text();

  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}
```

Agora o teste cai na condição estabelecida do e-mail nulo.

## Tomando uma decisão

Onde colocar a funcionalidade de criar um e-mail: dentro do Model `user` ou no Controller `/users`? Aqui a escolha é feita via `trade-off` (troca onde você perde de um lado e ganha de outro).

Colocar no Model faz com que sempre que seja criado um usuário, seja também enviado um email. Porém nem sempre é preciso seguir esse fluxo.

Para ter uma maior flexibilidade, sem amarrar o processo no Model, vamos gerir a criação do e-mail no Controller `/users`

```js
// trecho de pages/api/v1/users/index.js
// especulando o fluxo
async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  // 1. Criar Token de ativação
  // 2. Enviar esse Token por Email (Aqui temos que tomar novamente uma decisão de modelagem)

  return response.status(201).json(newUser);
}
```

> [!TIP]
> Deixar toda a responsabilidade dentro do controller Users não é uma boa prática.
> Temos que organizar melhor e abraçar essas regras em um local a parte.

# Model activation.js

```js
// models/activation.js
import email from "infra/email.js";

// Ao usar o template string no texto do e-mail, são considerados espaçamentos e recuos.
// Faça os ajustes necessários de indentação.
async function sendEmailToUser(user) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no FinTab

      https://link...

      Atenciosamente,
      Equipe FinTab.`,
  });
}

const activation = {
  sendEmailToUser,
};

export default activation;
```

Versão alternativa do código acima, deixando a implementação mais narrativa:

```js
// Trecho de models/activation.js
async function sendEmailToUser(user) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: createEmailText(),
  });

  // Função auxiliar, deixando mais "limpo" a construção do texto do e-mail.
  function createEmailText() {
    return `
    ${user.username}, clique no link abaixo para ativar seu cadastro no FinTab

    https://link...

    Atenciosamente,
    Equipe FinTab.
  `;
  }
}
```

Agora testando o envio do email de ativação

```js
async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  // 1. Criar Token de ativação.
  await activation.sendEmailToUser(newUser);

  return response.status(201).json(newUser);
}
```

Saída no terminal:

```bash
PASS  tests/integration/_use-cases/registration-flow.test.js
  Use case: Registration Flow (all successful)
    ✓ Create user account (114 ms)
    ✓ Receive activation email (5 ms)
    ✓ Activate account
    ✓ Login
    ✓ Get user information (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.613 s, estimated 1 s
Ran all test suites matching /registration-flow/i.
```
