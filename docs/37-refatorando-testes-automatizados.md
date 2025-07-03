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

### Corrigindo commits

Duas frases nos últimos commits podem ser melhoradas, então bora utilizar os comandos do git pra resolver.

```bash
# aqui voltamos a head, apontando para o commit anterior as modificações
# abrindo de forma interativa o rebase
git rebase -i 6b2eed22dd0914e6163743c2fb24a20e04d57231
```

O editor fica aberto para selecionar as opções do que fazer com cada commit

```bash
# pick não faz nada
pick 50cc993 chore: add `--verbose` to `test:watch`
# esse commit será editado. Pra manter a mesma mensagem, só fazer --amend --no-edit
edit 1590ab1 test: rename all descriptions to use new pattern
# esse commit será alterado apenas a mensagem
reword b2a83bb refactor: use `orchestrator.cleanDatabase` in tests
```

Ao fechar o editor, o git toma o controle e permite fazer a primeira alteração no edit 1590ab1 test...

Depois de alterar e fazer um novo commit, basta continuar as alterações com o rebase.

```bash
git rebase --continue
```

O git toma o controle de novo e muda edição da mensagem. Fechou e salvou o arquivo, basta rodar um git log pra conferir. Depois um git push -f pra atualizar a branch remota.

```bash
# git log com as alterações (novos hashes gerados sempre que há um novo commit)
commit 98bdb2c9811903cb5ee79ef353695c8a285648e0 (HEAD -> maintenance-patch, origin/maintenance-patch)
Author: Thiago Cajaiba <thiago.cajaiba@gmail.com>
Date:   Thu Jul 3 10:20:07 2025 -0300

    refactor: use `orchestrator.clearDatabase` in tests

commit dc3378f54513e749ec385a62b5f441e3e9e240f0
Author: Thiago Cajaiba <thiago.cajaiba@gmail.com>
Date:   Thu Jul 3 10:11:31 2025 -0300

    test: rename all descriptions to use new pattern

commit 50cc993aeea06533d54382a9ef7fea8f2e6f2678
Author: Thiago Cajaiba <thiago.cajaiba@gmail.com>
Date:   Thu Jul 3 09:55:36 2025 -0300

    chore: add `--verbose` to `test:watch`
```

### Corrigindo erro após atualização do node-pg-migrate

Mesmo o CI passando por todos os testes, as vezes o ambiente de produção pode rodar alguma coisa diferente e quebrar.

Como o `node-pg-migrate` foi atualizado pra versão 7, o deploy na vercel **bugou**.

```bash
#Acessando o log na vercel
Error: Can't get migration files: Error: ENOENT: no such file or directory, scandir 'infra/migrations/'
    at async readdir (node:internal/fs/promises:949:18)
```

Isso porque é uma hospedagem Serverless (sem servidor), rodando dentro de uma Lambda (como se fossem apenas funções anonimas), pode ter perdido seu reconhecimento automatizado de caminhos e diretórios.

```bash
# alterado pages/api/v1/migrations/index.js
# passando a usar o método resolve ao invés de join
-      dir: join("infra", "migrations"),
+      dir: resolve("infra", "migrations"),
```
