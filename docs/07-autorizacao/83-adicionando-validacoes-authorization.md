# Adicionando validações iniciais no "authorization"

Vamos colocar uma pequena validação no model `authorization` para garantir que o método lance um erro caso o desenvolvedor se esqueça de passar algum dos parâmetros necessários.

Isso força que algum hacker possa jogar lixo pra dentro, lançando um **erro 500** e o impedindo de continuar a ação maliciosa.

## Criando o primeiro teste unitário

O teste unitário é usado quando **não há nenhuma dependência externa para o nosso código**. Exemplos: banco de dados, escrita em arquivo, envio de emails, etc.

Vamos criar um novo arquivo chamado `authorization.test.js` na pasta `tests/unit`.

```js
// Trecho de tests/unit/authorization.test.js
import { InternalServerError } from "infra/errors";
import authorization from "models/authorization.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    // Se não informar o usuário retorna 500
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    // Se não informar as permissões validas, retorna 500
    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    // Se informar uma permissão desconhecida, retorna 500
    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    // Se informar uma permissão válida, retorna verdadeiro
    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };

      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });
});
```

## Validações principais em "authorization"

E fazemos os seguintes ajustes no modelo `authorization`:

```js
// Trecho de models/authorization.js

// lista de features disponíveis para cada usuário
const availableFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATION_TOKEN
  "read:activation_token",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  //... demais códigos abaixo

  // definimos a função `validateUser` para verificar se existe o usuário
  // ou se o usuário tem a feature necessária
  function validateUser(user) {
    if (!user || !user.features) {
      throw new InternalServerError({
        cause: "É necessário fornecer `user` no model `authorization`.",
      });
    }
  }

  // definimos a função `validateFeature` para verificar se a feature é válida
  function validateFeature(feature) {
    if (!feature || !availableFeatures.includes(feature)) {
      throw new InternalServerError({
        cause:
          "É necessário fornecer uma `feature` conhecida no model `authorization`.",
      });
    }
  }
}
```

OK, o fluxo para o método `can()` contempla os testes, vamos agora para o método `filterOutput()`:

```js
// Trecho de models/authorization.js
function filterOutput(user, feature, resource) {
  // Novamente as validações no topo do método
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  // Detalhes do método de filtragem de saída
  function validateResource(resource) {
    if (!resource) {
      throw new InternalServerError({
        cause:
          "É necessário fornecer um `resource` em `authorization.filterOutput()`.",
      });
    }
  }
}
```

E agora criando os casos de teste para o método `filterOutput()`:

```js
// Trecho de tests/unit/authorization.test.js
describe(".filterOutput()", () => {
  test("without `user`", () => {
    expect(() => {
      authorization.filterOutput();
    }).toThrow(InternalServerError);
  });

  test("without `user.features`", () => {
    const createdUser = {
      username: "UserWithoutFeatures",
    };

    expect(() => {
      authorization.filterOutput(createdUser);
    }).toThrow(InternalServerError);
  });

  test("with unknown `feature`", () => {
    const createdUser = {
      features: [],
    };

    expect(() => {
      authorization.filterOutput(createdUser, "unknown:feature");
    }).toThrow(InternalServerError);
  });

  test("with valid `user`, known `feature` but no `resource`", () => {
    const createdUser = {
      features: ["read:user"],
    };

    expect(() => {
      authorization.filterOutput(createdUser, "read:user");
    }).toThrow(InternalServerError);
  });

  // Aqui asseguramos que estão sendo passados apenas os parâmetros esperados
  test("with valid `user`, known `feature` and `resource`", () => {
    const createdUser = {
      features: ["read:user"],
    };

    const resource = {
      id: 1,
      username: "resource",
      features: ["read:user"],
      created_at: "2026-0101T00:00:00.000Z",
      updated_at: "2026-0101T00:00:00.000Z",
      email: "resource@resource.com",
      password_hash: "resource",
    };

    const result = authorization.filterOutput(
      createdUser,
      "read:user",
      resource,
    );

    expect(result).toEqual({
      id: 1,
      username: "resource",
      features: ["read:user"],
      created_at: "2026-0101T00:00:00.000Z",
      updated_at: "2026-0101T00:00:00.000Z",
    });
  });
});
```

Resultados dos testes:

```bash
npm run test:watch tests/unit/authorization.test.js

## Saída no terminal
 PASS  tests/unit/authorization.test.js
  models/authorization.js
    .can()
      ✓ without `user` (10 ms)
      ✓ without `user.features` (1 ms)
      ✓ with unknown `feature` (1 ms)
      ✓ with valid `user` and known `feature` (1 ms)
    .filterOutput()
      ✓ without `user` (1 ms)
      ✓ without `user.features` (1 ms)
      ✓ with unknown `feature`
      ✓ with valid `user`, known `feature` but no `resource` (1 ms)
      ✓ with valid `user`, known `feature` and `resource` (1 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        0.406 s, estimated 1 s
```
