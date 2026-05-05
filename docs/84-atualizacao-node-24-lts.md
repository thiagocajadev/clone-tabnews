# Atualizando a versão do Node 24 LTS

Periodicamente, temos que atualizar as dependências do projeto, incluindo a versão do Node utilizada no projeto.

A tecnologia evolui e todos os dias novas versões são lançadas com correções de bugs, novas funcionalidades e melhorias de segurança. Provedores de serviços como AWS, Google Cloud, Vercel, etc. lançam novas versões de seus serviços e é importante manter o projeto atualizado para usufruir de todas as novidades.

## Vercel

A versão da suporte a versões mais recentes LTS (long term support, suporte de longo prazo). Atualmente, a versão LTS do Node é a 24. Vamos atualizar via manifesto no arquivo package.json.

**engines**: engines indica a versão do node que deve ser utilizada no projeto.

```json
// trecho de package.json
{
  "engines": {
    "node": "24"
  }
}
```

## Centralizando a versão do node no projeto

Temos espalhados no projeto vários arquivos que definem a versão do node. Vamos centralizar em um só arquivo.

locais:

- .nvmrc
- .github/workflows/linting.yaml
- .github/workflows/tests.yaml
- package.json

Quem agora é a fonte de verdade é o package.json. os outros arquivos vão pegar a versão de lá.

```js
// nos arquivos vamos utilizar essa propriedade
node-version-file: "package.json"

// e no .nvmrc vamos colocar apenas a versão
24
```

## Ajustando a versão

```bash
# checando a versão atual
nvm alias

# atualizando para a versão 24
nvm alias default 24
rm -rf node_modules
npm install

# rodar o lint e os testes pra ter certeza que está tudo funcionando
npm run lint:eslint:check
npm test

# log dos testes

# [jest] Test Suites: 14 passed, 14 total
# [jest] Tests:       58 passed, 58 total
# [jest] Snapshots:   0 total
# [jest] Time:        4.865 s
# [jest] Ran all test suites.
# [jest] jest --runInBand exited with code 0
# --> Sending SIGTERM to other processes..
```
