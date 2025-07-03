# 🧪 Refatorando testes

Os testes tem funcionado até então, mas precisam evoluir e atender outros tipos de `comportamentos`.

## BDD - Behavior Driven Design

`BDD` ou `Desenvolvimento Guiado a Comportamentos` é abordagem que envolve a área de negócios e garantia de qualidade.

A vantagem sobre o TDD é que temos testes mais relevantes para o negócio.

Uma técnica de BDD é o `Gherkin` (Picles), que visa conservar os testes para que tanto `Devs` quanto `Business` consigam consumir.

Fazendo essa analogia com Picles em conserva, foi criado uma framework de testes chamado `Cucumber` (Pepino), que automatiza a execução das baterias de testes.

### Sintaxe Gherkin

Resumindo:

- **Given**: Dado uma determinada condição.
- **When**: Quando acontecer essa condição.
- **Then**: Tomar uma ação sobre essa condição.

Exemplo:

Given: the user is not logged in. (Dado que o usuário não está logado).
When: the user make a POST to /migrations endpoint. (Quando o usuário faz um POST para...).
Then: the migrations should be executed successfully. (Então as migrações devem ser executadas...).

> Fica muito mais compreensível esse tipo de descrição para pessoas não técnicas, trazendo para
> diminuindo a barreira de negócios.

Como há muitos outros recursos que podem ser utilizados nos testes, é uma boa procurar o equilíbrio, sem gerar complexidade extra.

E falando em boa, uma boa prática é definir `contexto` do teste e qual `afirmação`, o que deve acontecer no teste.

Separando mais um pouco, o **contexto fica na descrição** e a **afirmação fica no código**.

```js
// alterando tests/integration/api/v1/status/get.test.js
// ... código acima

// antes
test("GET to /api/v1/status should return 200", async () => {})...

// depois
// definição do contexto em describe
describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    // deixando a afirmação apenas no código em si, removendo código de retorno da descrição
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
```

Saída no terminal:

```bash
 PASS  tests/integration/api/v1/status/get.test.js
  GET /api/v1/status
    Anonymous user
      ✓ Retrieving current system status (17 ms)
```

> Agora temos uma saída seguindo linguagem natural, indicando o endpoint, qual tipo de requisição está sendo feita contra ele, qual o usuário está fazendo e qual a ação o teste executou.
