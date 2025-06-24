# 🪝 Git Hooks

Muito legal toda essa automatização no CI, verificando o padrão dos commits.

Seria tão legal validar o commit local antes de mandar via push para o repositório remoto né?

Seria não... é legal e o Git possui o recurso `Hooks` para isso.

Os hooks (ou ganchos) do Git são scripts executados automaticamente em pontos específicos do fluxo de trabalho, antes, durante ou depois de certos eventos, como commit, push, merge, entre outros. Eles ficam localizados no diretório .git/hooks e permitem customizar ou validar ações no repositório.

Exemplos práticos:
`pre-commit`: roda antes de um commit ser finalizado. Ideal para linters ou testes automáticos.

`commit-msg`: roda durante o commit, e pode validar a mensagem (por exemplo, se segue um padrão).

`post-merge`: roda depois de um merge. Pode ser usado para reinstalar dependências, por exemplo.

```bash
# acessando a pasta do git local, com exemplos de hooks
# remover o .sample do nome de um hook, faz ele começar a ser executado pelo git
clone-tabnews on  lint-commits [!+?] is 📦 v1.0.0 via  v18.20.8
❯ cd .git/hooks

clone-tabnews/.git/hooks on  lint-commits [!+?]
❯ ls
applypatch-msg.sample      pre-push.sample
commit-msg.sample          pre-rebase.sample
fsmonitor-watchman.sample  pre-receive.sample
post-update.sample         prepare-commit-msg.sample
pre-applypatch.sample      push-to-checkout.sample
pre-commit.sample          sendemail-validate.sample
pre-merge-commit.sample    update.sample
```

Toda solução sempre pode apresentar efeitos colaterais e aqui não é diferente.

Como os hooks são scripts em shell, são executados direto na maquina local, podendo afetar a segurança.

Outra situação é: como padronizar esses hooks para equipes e manter eles sempre atualizados? O git não versiona os hooks.

Poderia ser criado uma pasta no projeto chamada hooks e adicionar os scrips nela para compartilhar.

## Husky

Por sorte, foi criado um projeto open source para resolver essa questão, o `Husky`.

Ele abstrai toda complexidade de gestão de hooks e padronização.

```bash
# instala o husky
npm install --save-dev husky@9.1.4

# inicializa o husky
npx husky init

# olhando com o git diff no package.json, é criado o script com comando prepare
+    "prepare": "husky"

# verificando o .git/config, foi atualizado o diretório padrão dos hooks
clone-tabnews on  hooks [!+?] is 📦 v1.0.0 via  v18.20.8
❯ cat .git/config
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        # agora aponta pro diretório especial .husky -> _
        hooksPath = .husky/_
```

A gente não mexe na pasta underscore `_`, somente adiciona hooks dentro de `.husky`.

> Arquivos de exemplo criados pela instalação padrão devem ser apagados em .husky

### Criando scripts no Husky

Crie um novo arquivo `commit-msg`

```bash
# .husky/commit-msg
# valida a mensagem de commit usando o CommitLint
# $1 representa o caminho para o arquivo temporário que contém a mensagem do commit
npx commitlint --edit $1
```

Detalhamento:

$1 é o primeiro argumento passado ao hook, que no caso do commit-msg é o caminho para o arquivo temporário contendo a mensagem de commit.

`npx commitlint --edit $1` diz ao CommitLint para validar a mensagem de commit contida nesse arquivo, de acordo com as regras definidas na sua configuração (no caso `commitlint.config.js`).

```bash
# commit de teste com log
clone-tabnews on  hooks [+] is 📦 v1.0.0 via  v18.20.8
❯ git commit -m 'teste de commit'
⧗   input: teste de commit
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint

husky - commit-msg script failed (code 1)
```

Agora temos a validação de commits local!!! 🥳

e o comando pra fazer commit é o mesmo, ou seja, alterações e modificações internas adicionaram melhorias ao `git`.

## Commitizen

Para facilitar o lembrete de tipos de commit (feat, fix, ci), temos um modulo muito popular chamado `commitizen`

```bash
# instala o commitizen
npm i -D commitizen@4.3.0

# configura para uso local
npx commitizen init cz-conventional-changelog --save-dev --save-exact

# dando uma olhada com git diff
       "devDependencies": {
         "@commitlint/cli": "^19.3.0",
         "@commitlint/config-conventional": "^19.2.2",
+        "commitizen": "^4.3.0",
         "concurrently": "^8.2.2",
+        "cz-conventional-changelog": "^3.3.0", # configurado adaptador para uso do conventional commits

# olhando mais um pouco, foi gerada configuração com caminho padrão pro commitizen
+  },
+  "config": {
+    "commitizen": {
+      "path": "./node_modules/cz-conventional-changelog"
+    }
```

Com isso feito, bora criar um script para executar o commitizen

```js
// package.json
// scripts...
   "wait-for-postgres": "node infra/scripts/wait-for-postgres.js",
    "prepare": "husky",
    "commit": "cz" // ao executar o comando commit, ele executa o cz do commitizen
```

Agora ao executar um `npm run commit`, temos todas as opções de tipo de commit em lista:

```bash
clone-tabnews on  hooks [+] is 📦 v1.0.0 via  v18.20.8 took 2s
❯ npm run commit

> clone-tabnews@1.0.0 commit
> cz

cz-cli@4.3.0, cz-conventional-changelog@3.3.0

? Select the type of change that you're committing: (Use arrow keys)
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect the meaning of the code
(white-space, formatting, missing semi-colons, etc)
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
```

Fechou! Temos um passo a passo para escrever o commit de forma padrão, sem deixar nenhuma ponta solta.
