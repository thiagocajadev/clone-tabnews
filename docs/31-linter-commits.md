# 🧹 Limpando e padronizando Commits

Assim como fizemos usando o Prettier e ESLint na padronização do estilo e qualidade de código, é possível padronizar os commits via actions.

"As vezes o lento demora mais pois escolheu um caminho mais profundo."

"Ir apenas pelo caminho superficial não faz criar raízes."

## Commit lint

O commitlint.js é uma ferramenta de linha de comando que auxilia na aplicação nas regras de commit. Ele é bem flexível na gestão de regras.

Ele aceita a configurações dos Hooks do GitHub para validação, sendo perfeito para uso no CI.

```bash
# i -D abreviatura para install --save-dev, apenas dependência de desenvolvimento
# instala o core do commitlint
npm i -D @commitlint/cli@19.3.0

# instala o módulo de convenções
npm i -D @commitlint/config-conventional@19.2.2
```

Agora configurando na raiz do projeto:

```js
// commitlint.config.js
// habilita o uso das convenções
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

Para testar no terminal, podemos usar o recurso `npx`. Ele executa o módulo (se existir) ou instala de forma temporária e executa.

> 💡 O x é de eXecute -> Node Package Execute

```bash
# executando
npx commitlint
@commitlint/cli@19.3.0 - Lint your commit messages

[input] reads from stdin if --edit, --env, --from and --to are omitted

# ele aceita o entradas padrão, permitindo o echo pra exibir no terminal
echo "Teste" | npx commitlint

# retorno do log, simulando apenas a palavra Teste na mensagem do commit
clone-tabnews on  lint-commits [!?] is 📦 v1.0.0 via  v18.20.8
❯ echo "Teste" | npx commitlint
⧗   input: Teste
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

O log exibe o que faltou no padrão e indica o que fazer. Temos 2 indefinições:

- subject may not be empty [subject-empty] -> assunto indefinido
- type may not be empty [type-empty] -> tipo de commit indefinido

```bash

# realizando novo teste, agora com a definição do tipo e conteúdo
echo "teste: mensagem de commit" | npx commitlint

# log retorna erro, pois o tipo de commit não está contido no array padrão
clone-tabnews on  lint-commits [!?] is 📦 v1.0.0 via  v18.20.8
❯ echo "teste: mensagem de commit" | npx commitlint
⧗   input: teste: mensagem de commit
✖   type must be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test] [type-enum]

✖   found 1 problems, 0 warnings

# log retorna erro caso o tipo não esteja todo em minúsculo
echo "Feat: mensagem de commit" | npx commitlint
⧗   input: Feat: mensagem de commit
✖   type must be lower-case [type-case]
```
