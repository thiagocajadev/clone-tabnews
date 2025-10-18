# Authorization - Parte 1

Chegou a hora de fazermos uma **reforma** no código, para juntar a autenticação com a autorização no sistema.

O fluxo que a aplicação deve atender:

1. Criar uma conta.
1. Receber um email para ativar esta conta (confirmar o email).
1. Clicar no link dentro deste email, ativar a conta e receber as credenciais base.
1. Conseguir criar uma nova sessão no sistema.
1. E apenas com ela conseguir executar ações contra a API (nos endpoints que precisam de credencial).

## Criando teste com o fluxo para registrar

Vamos criar um caso de uso, executando os testes em sequência para atender o fluxo de autorização

```js
// tests/integration/_use-cases/registration-flow.test.js
import password from "models/password.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    const createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@curso.dev",
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
```

## Lidando com impasses

Bastante coisa até aqui. E nesse momento pode bater uma sensação de estar **afogado** ou sofrendo de **dead lock** (trava da morte 💀).

> **Deadlock** é quando dois processos no banco de dados ficam “travados” esperando um ao outro liberar um recurso. É como uma referência circular: o processo A segura algo que o B precisa, e o B segura algo que o A precisa. Resultado: nenhum dos dois consegue continuar.

Pra tirar esse sentimento de **agonia**, é preciso coragem e começar a resolver de algum lugar. Aqui podemos comparar com o jogo campo minado: a gente não sabe por onde começar, mas precisa escolher qualquer ponto de partida.

![Campo minado](img/autenticacao-campo-minado-bomba.png)
créditos: [campo minado online](https://campo-minado.com/)

Após o primeiro passo, vamos adaptando as ações, tomando os devidos cuidados. Em alguns momentos, nada pode ser revelado. E o segredo aqui é ir tentando até **mapear todo o terreno**. Mas não tem jeito, vez o outra vamos pisar em uma **bomba** 💣.

E isso é ótimo 💣💣💣! É importante saber que por esse caminho não da pra continuar. Temos que aceitar que isso acontece e vai acontecer muitas vezes.

A gente nunca perde tempo ou joga trabalho fora na área de desenvolvimento. Mesmo se afastando inicialmente do objetivo final, todos os testes e implementações que falharam vão norteando e guiando para o caminho correto. A melhor versão só sai após várias versões **rascunho**.

## Criando uma nova migration

Toda alteração no banco de dados só pode ser feita com uma nova migration. Nunca alteramos uma migration que já foi criada.

> [!NOTE]
>
> Lembre-se: **Forward-only**, a gente vai avançando com as mudanças. Seguimos sempre em frente!

Bora pro terminal:

```bash
# Aqui adicionamos a coluna features na tabela users.
# Seguindo o padrão de convenções da turma do rails, temos:

# npm run migrations:create add [coluna] to [tabela]
npm run migrations:create add features to users
```

Limpando os ruídos gerados pelo `node-pg-migrate`:

```js
// infra/migrations/1758469653054_add-features-to-users.js
exports.up = (pgm) => {
  pgm.addColumn("users", {
    features: {
      // Se "array" soa estranho, pense em uma coleção de itens.
      // Aqui: coleção de textos (varchar[]).
      type: "varchar[]",
      notNull: true,
      default: "{}",
    },
  });
};

exports.down = false;
```

Agora executando todos os testes, se prepare para as bombas 💣💣💣!

```bash
npm test

# Saída terminal
# [jest] Test Suites: 5 failed, 7 passed, 12 total
# [jest] Tests:       9 failed, 25 passed, 34 total
```

## Desafios

Só coice e cotovelada dos testes 🐴🦾! Agora ou a gente **contínua e segue o fluxo de registro** ou **conserta o que quebrou**, antes de prosseguir.

### Desafio 1º - Entendendo as falhas

Os testes quebraram porque a **estrutura do objeto mudou depois da migration**.

O `toEqual` exige que os 2 objetos tenham o mesma estrutura e valores. Se tiver campo extra ou faltando, quebra.

Pesquisando sobre isso, uma alternativa pra dar **match** do jeito que está e passar nos testes seria uso do `toMatchObject`.

```js
// trecho de tests/integration/_use-cases/registration-flow.test.js
// Assim o teste passa, porém novas propriedades acabam sendo ocultadas,
// deixando o teste menos assertivo.
expect(createUserResponseBody).toMatchObject({
  id: createUserResponseBody.id,
  username: "RegistrationFlow",
  email: "registration.flow@curso.dev",
  password: createUserResponseBody.password,
  created_at: createUserResponseBody.created_at,
  updated_at: createUserResponseBody.updated_at,
});
```

### Desafio 2º - Tomada de decisão

**Continuar o desenvolvimento** ou **parar pra resolver** e depois continuar?

Aqui a gente pode utilizar aquela analogia que o `filipedeschamps` faz sobre qual será o **saldo** de escolher um caminho. Só incluir uma propriedade nos testes não é tão trabalhoso.

```js
// trecho de tests/integration/api/v1/users/[username]/get.test.js
// testando apenas um caso específico
test("With case mismatch", async () => {
  const createdUser = await orchestrator.createUser({
    username: "CaseDiferente",
  });

  const response = await fetch(
    "http://localhost:3000/api/v1/users/casediferente",
  );

  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    id: responseBody.id,
    username: "CaseDiferente",
    email: createdUser.email,
    features: [], // adicionada propriedade
    password: responseBody.password,
    created_at: responseBody.created_at,
    updated_at: responseBody.updated_at,
  });

  expect(uuidVersion(responseBody.id)).toBe(4);
  expect(Date.parse(responseBody.created_at)).not.toBeNaN();
  expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
});
```

Executando no terminal

```bash
npm run test:watch -- -t "With case mismatch"

# Saída
# PASS  tests/integration/api/v1/users/[username]/get.test.js
#   GET /api/v1/users/[username]
#     Anonymous user
#       ✓ With case mismatch (39 ms)
#       ○ skipped With exact case match
#       ○ skipped With nonexistent username
#
# Test Suites: 11 skipped, 1 passed, 1 of 12 total
# Tests:       33 skipped, 1 passed, 34 total
# Snapshots:   0 total
# Time:        1.062 s, estimated 3 s
# Ran all test suites with tests matching "With case mismatch".
```

Eu gostaria de seguir em frente, mesmo com os testes quebrados, só pra ter mais bombas pra pisar 💣💣💣😅!
