# 🔒 Protegendo segredos

Aceitando o desafio proposto para proteção contra vazamento de segredos no código, vamos incluir um plugin ao ESLint, o [no-secrets](https://www.npmjs.com/package/eslint-plugin-no-secrets).

**Justificativa:** Arquitetura do projeto. Vamos continuar o mais próximo do ecossistema javascript, seguindo a didática até essa aula, ser perder o foco na construção passo a passo.

## Plugin eslint no-secrets

```bash
# instala o plugin como dependência de desenvolvimento
# optei pela versão estável até o momento, compatível com a versão do projeto
npm i -D eslint-plugin-no-secrets@^2.2.1
```

O plugin `no-secrets` utiliza em seu algoritmo a combinação de `regex + entropia`.

Então, ele procura com base na aleatoriedade de chaves conhecidas por padrão e tamanho, gerando alertas.

Para configurar, basta adicionar ao eslintrc.json

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended",
    "next/core-web-vitals",
    "prettier"
  ],
  // habilita o plugin
  "plugins": ["no-secrets"],
  "rules": {
    // delimita as regras utilizadas e qual o nível de entropia para checar um comportamento
    // de possível vazamento de credenciais e dados sensíveis
    "no-secrets/no-secrets": ["error", { "tolerance": 4.5 }]
  }
}
```

> 💡 Quanto menor a tolerância definida, maior a chance de falsos positivos.

Para testar, vamos criar uma variável que contem uma `chave secreta` no endpoint status:

```js
// alterado trecho do endpoint status/index.js
async function status(request, response) {
  const secret = "sk_test_51H4XGDFK5f9vzjAKxExemploFakeTokenDeTest3";
  console.log("Segredo:", secret);
  // demais códigos
}
```

### Testando no terminal com eslint:

```bash
# comando eslint filtrando a busca por segredos em arquivos do tipo javascript
# --ext: extensões
npx eslint . --ext .js,.jsx

# log do terminal
clone-tabnews on lint-no-secrets
❯ npx eslint . --ext .js,.jsx

# encontrou um vazamento!
/home/thiago/git/clone-tabnews/pages/api/v1/status/index.js
  4:18  error  Found a string with entropy 4.68 : "sk_test_51H4XGDFK5f9vzjAKxExemploFakeTokenDeTest3"  no-secrets/no-secrets

✖ 1 problem (1 error, 0 warnings)
```

Funciona! Mas vamos testar com uma outra chave:

```bash
const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

# executando para avaliar os arquivos
clone-tabnews on lint-no-secrets
❯ npx eslint . --ext .js,.jsx

# não encontrou o vazamento!
clone-tabnews on lint-no-secrets
❯
```

Não pegou! Olha ai o buraco deixado por conta da questão da `entropia`.

Pra resolver isso, alteramos a tolerância para 4.0, deixando o filtro mais rigoroso, com bom controle contra falsos positivos.

```json
// trecho do .eslintrc.json
"rules": {
  "no-secrets/no-secrets": ["error", { "tolerance": 4.0 }]
},
```

```bash
# realizado novo teste. Log do terminal
clone-tabnews on lint-no-secrets
❯ npx eslint . --ext .js,.jsx

# encontrou o vazamento!
/home/thiago/git/clone-tabnews/pages/api/v1/status/index.js
  4:18  error  Found a string with entropy 4.45 : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  no-secrets/no-secrets

✖ 1 problem (1 error, 0 warnings)
```

Como apenas habilitamos um plugin no ESLint, o comando que faz o lint check ganhar esse **poder** de verificação.

```bash
npm run lint:eslint:check

# log do terminal rodando lint:eslint:check
clone-tabnews on lint-no-secrets
❯ npm run lint:eslint:check

> clone-tabnews@1.0.0 lint:eslint:check
> next lint --dir .

# encontrou o vazamento!
./pages/api/v1/status/index.js
4:18  Error: Found a string with entropy 4.45 : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  no-secrets/no-secrets
```

> Como já temos estruturado o lint:eslint:check, não precisamos alterar nada no workflow para o CI.

Pra ver se isso é verdade, vou fazer um commit e mandar pro GitHub pra conferir.

![CI - erro com no secrets](img/ci-eslint-no-secrets-erro.png)

Olha só, a action falhou e pegou o erro!!! Então funcionou.

> 💡 Fica o ponto de atenção aqui. Como não bloqueamos o commit e push, subiu pro CI um dado sensível.
> Em um caso real, a primeira coisa a fazer seria trocar as credenciais com urgência.

## Adicionando ao Husky

Para evitar essa subida pro repositório, adicionamos ao `Husky` um hook de segurança.

```bash
# criado hook pre-commit no diretório .husky/pre-commit
npm run lint:eslint:check
```

Ao tentar fazer o commit, é executada verificação:

```bash
clone-tabnews on lint-no-secrets
❯ git commit -m 'ci: add `Husky pre-commit hook`'

> clone-tabnews@1.0.0 lint:eslint:check
> next lint --dir .

# encontrou o vazamento!
./pages/api/v1/status/index.js
4:18  Error: Found a string with entropy 4.45 : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  no-secrets/no-secrets

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
husky - pre-commit script failed (code 1)
```

Agora sim. Temos uma barreira desde o código local até o CI, reduzindo as chances de exposição de segredos.

> E se quisermos analisar também arquivos do tipo YAML e JSON? Vou deixar passos opcionais abaixo, porém não vou manter no projeto. Não quero criar uma complexidade extra, nos afastando do foco didático do curso até essa aula.

## Adicionando cobertura para extensões adicionais

Por padrão o ESLint cobre apenas JavaScript e TypeScript. Mas, podemos adicionar uma extensão para `.yaml` e `.json`

```bash
# plugin para YAML
npm i -D eslint-plugin-yml@1.18.0

# analisador sintático de arquivos YAML
npm i -D yaml-eslint-parser@1.3.0

# analisador sintático de arquivos JSON
npm i -D jsonc-eslint-parser@2.1.0
```

Após instalar o plugin e os parsers, é hora de configurar as regras no `.eslintrc.json`:

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended",
    "next/core-web-vitals",
    "prettier"
  ],
  // habilita os plugins no eslint
  "plugins": ["no-secrets", "yml"],
  "rules": {
    "no-secrets/no-secrets": ["error", { "tolerance": 4.0 }]
  },
  "overrides": [
    {
      // verifica arquivos com extensões yml e yaml
      "files": ["**/*.yml", "**/*.yaml"],
      "extends": ["plugin:yml/standard"],
      "parser": "yaml-eslint-parser",
      "rules": {
        "no-secrets/no-secrets": ["error", { "tolerance": 4.0 }],
        // desabilita a checagem de aspas duplas no yaml
        "yml/plain-scalar": "off"
      }
    },
    {
      // avalia extensão json
      "files": ["**/*.json"],
      // remove da verificação o package-lock
      // devido a grande quantidade de hashes escritos nele
      // gerando falsos positivos
      "excludedFiles": ["**/package-lock.json"],
      "parser": "jsonc-eslint-parser",
      "rules": {
        "no-secrets/no-secrets": ["error", { "tolerance": 4.0 }]
      }
    }
  ]
}
```

### Realizando testes com recursos para yaml e json

Após reverter o código com a variável secret no endpoint status, vamos criar um json na raiz do projeto.

```json
//mock-credentials.json
{
  "github_token": "ghp_1234567890abcdefghijklmnopqrstuvwx",
  "supabase_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.signature",
  "vercel_token": "vc1234-abcdEFGH5678ijklMNOP90qrst"
}
```

Testando no terminal com `npx eslint . --ext .json`, filtrando somente a extensão `.json`:

```bash
clone-tabnews on  lint-no-secrets
❯ npx eslint . --ext .json

# segredos identificados
/home/thiago/git/clone-tabnews/mock-credencials.json
  2:19  error  Found a string with entropy 5.09 : "ghp_1234567890abcdefghijklmnopqrstuvwx"                      no-secrets/no-secrets
  3:19  error  Found a string with entropy 4.74 : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.signature"  no-secrets/no-secrets
  4:19  error  Found a string with entropy 4.83 : "vc1234-abcdEFGH5678ijklMNOP90qrst"                           no-secrets/no-secrets

✖ 3 problems (3 errors, 0 warnings)
```

Testando com `lint:eslint:check`:

```bash
clone-tabnews on  lint-no-secrets
❯ npm run lint:eslint:check

> clone-tabnews@1.0.0 lint:eslint:check
> next lint --dir .

# não identificou o vazamento de dados sensíveis
✔ No ESLint warnings or errors
```

Por que o comando não funciona? o `next lint --dir .` analisa apenas arquivos dentro da estrutura do next.

Então temos que tomar uma decisão de escopo: usar `eslint` para cobrir e analisar todo o projeto ou focar apenas em vazamentos na estrutura do next com `next lint`.

Bons estudos pessoal!
