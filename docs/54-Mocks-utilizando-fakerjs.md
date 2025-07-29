# Organizando o Orchestrator

Primeiro, vamos organizar os testes de GET e POST para criação de usuário. O GET por padrão apenas deve retornar dados ao ser consultado. Quem deve escrever dados no sistema é o POST.

```js
// tests/users/[username]/get.test.js
describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      // passada a responsabilidade pro orquestrador criar o usuário
      await orchestrator.createUser({
        // mantido apenas o payload com os dados do usuário
        username: "MesmoCase",
        email: "mesmo.case@curso.dev",
        password: "senha123",
      });
      // demais códigos...
    });
  });
});
```

Simplificando teste com patch.test.js

```js
// tests/users/[username]/patch.test.js
// aqui quero testar apenas o nome de usuário duplicado
// o payload trazendo email e senha não são importantes pra esse teste
test("With duplicated 'username'", async () => {
  // com a abstração pro createUser, o código foi simplificado
  await orchestrator.createUser({
    username: "user1",
    email: "user1@curso.dev",
    password: "senha123",
  });

  await orchestrator.createUser({
    username: "user2",
    email: "user2@curso.dev",
    password: "senha123",
  });
});
```

Legal, mas precisamos gerar dados válidos aleatórios pra melhorar a questão dos testes.

## Usando faker.js

O `faker.js` consegue gerar dados falsos, seguindo um tipo específico para preencher uma informação. Ex: email, nome, local, etc.

```bash
# instala a versão exata do módulo, com a dependência apenas para desenvolvimento
npm i -E -D @faker-js/faker@9.7.0
```

Agora importando o módulo pro orchestrator:

```js
// uma boa prática é separar as importações das dependências entre externo e interno.
// recursos externos, vem de módulos instalados.
import retry from "async-retry";
import { faker } from "@faker-js/faker";

// recursos internos, componentes criados dentro do projeto,
// adicionando o sufixo ".js" pra facilitar a identificação.
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";

// usando o faker como fallback, caso a propriedade não seja informada
async function createUser(userObject) {
  const newUser = await user.create({
    username: userObject.username,
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "validPassword",
  });

  console.log("NewUser: ", newUser);
}

// log na console
 NewUser:  {
  id: 'aa3bd642-6aed-4476-b5aa-0a65ac22b739',
  username: 'user1',
  email: 'Marques.MacGyver@yahoo.com',
  password: '$2b$04$/2MdoBens.f6NTDek4CFgu/EjWZ2x85bYPrI1gVF.//Ldkjik/0kK',
  created_at: 2025-07-29T14:09:55.899Z,
  updated_at: 2025-07-29T14:09:55.899Z
}

at Object.log [as createUser] (tests/orchestrator.js:42:11)

NewUser:  {
  id: '9dc867f3-6cde-405c-af41-92a5d4395558',
  username: 'user2',
  email: 'Reymundo4@gmail.com',
  password: '$2b$04$AUnCay/t6Nj2cNa/B7VI6OdWY6Psz/d7WmwdoAgoDxIUmjEv...9m',
  created_at: 2025-07-29T14:09:55.937Z,
  updated_at: 2025-07-29T14:09:55.937Z
}
```

Agora, podemos passar diversos valores fallback, preenchendo propriedades obrigatórias com dados validos, limpando os casos de teste.

```js
async function createUser(userObject) {
  // retorna o objeto para recuperar as propriedades e melhorar os testes
  return await user.create({
    username:
      userObject.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || faker.internet.password(),
  });
}

// nesse trecho, o nome de usuário é limpo com expressão regular (RegEx).
// remove caracteres underscore, ponto e traço.
faker.internet.username().replace(/[_.-]/g, "");
```

Refatorando o teste para comparar um email duplicado:

```js
test("With duplicated 'email'", async () => {
  await orchestrator.createUser({
    email: "email1@curso.dev",
  });

  // guarda o retorno na variável, recuperando todas as propriedades do objeto
  const createdUser2 = await orchestrator.createUser({
    email: "email2@curso.dev",
  });

  // usando templateString, passando como parâmetro o nome de usuário na URL
  const response = await fetch(
    `http://localhost:3000/api/v1/users/${createdUser2.username}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email1@curso.dev",
      }),
    },
  );
});
```

Show de bola!
