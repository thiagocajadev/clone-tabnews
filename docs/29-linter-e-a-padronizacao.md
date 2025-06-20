# 🧹 Linting

Já passamos a utilizar de certa forma um linter de código com `editorconfig + prettier`.

Porém, o lint de código não se resume a só isso.

A pratica do linting ou análise estática de código é uma boa prática para evitar que software saia dos eixos.

Então podemos expandir esse conceito em 2 partes:

Pré lint ou pré formatador -> Atuação na formatação de estilo do código.

Quando instalamos o `EditorConfig for VS Code` forçamos o uso de regras e definição de estilos antes de salvar os arquivos. Ex: 2 espaços ao usar tab.

Pós lint -> Atuação na qualidade do código.

Aqui no pós já temos tanto o tratamento de estilização padrão quanto a qualidade do código ao salvar os arquivos.

Bons exemplos são o `Prettier` para estilização e o `ESLint` para qualidade.

> Uma combinação desses 2 tipos de linter é o [Biome](https://biomejs.dev/pt-br/)

## Criando Workflow de linting

Para executar o linting via actions no github, podemos criar um novo fluxo de trabalho.

```yaml
name: Linting

on: pull_request

jobs:
  prettier:
    name: Prettier # Como é apenas formatação, não precisa especificar o S.O.
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "lts/hydrogen"

      - run: npm ci

      # script conforme definido no package.json
      - run: npm run lint:prettier:check # roda o comando especifico do prettier
```

Agora, basta fazer o PR... e configurar mais um `RuleSet` no GitHub para tornar essa etapa obrigatória.

![Sem ruleset](img/github-linter-sem-ruleset.png)
