# 🔒 Protegendo segredos

Aproveitando o desafio proposto no curso e seguindo as ferramentas utilizadas, vamos incluir um plugin ao ESLint, o `no-secrets`.

Para analisar arquivos de configuração e variáveis de ambiente, combinamos com o `secretlint`.

Justificativa: Arquitetura do projeto. Prefiro continuar o mais próximo do ecossistema javascript.

## Plugin eslint no-secrets

```bash
# instala o plugin como dependência de dev
# optei pela versão estável até o momento
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

> Quanto menor a tolerância definida, maior a chance de falsos positivos.

Para testar, adicionando uma variável que contem uma `chave secreta` no endpoint status:

```js
// alterado trecho do endpoint status/index.js
async function status(request, response) {
  const secret = "sk_test_51H4XGDFK5f9vzjAKxExemploFakeTokenDeTest3";
  console.log("Segredo:", secret);
  // demais códigos
}
```

Testando no termina com eslint:

```bash
# comando eslint filtrando a busca por segredos em arquivos do tipo javascript
# --ext: extensões
npx eslint . --ext .js,.jsx

# log do terminal
clone-tabnews on  lint-no-secrets
❯ npx eslint . --ext .js,.jsx

/home/thiago/git/clone-tabnews/pages/api/v1/status/index.js
  4:18  error  Found a string with entropy 4.68 : "sk_test_51H4XGDFK5f9vzjAKxExemploFakeTokenDeTest3"  no-secrets/no-secrets

✖ 1 problem (1 error, 0 warnings)
```

Funciona! Mas vamos testar com uma outra chave:

```bash
const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

# executando para avaliar os arquivos
clone-tabnews on  lint-no-secrets
❯ npx eslint . --ext .js,.jsx

clone-tabnews on  lint-no-secrets
❯
```

Não pegou! Olha ai o buraco deixado por conta da questão da entropia.

Alterando para 4.0, deixando o filtro mais rigoroso, sem gerar falsos positivos.

```bash
clone-tabnews on  lint-no-secrets
❯ npx eslint . --ext .js,.jsx

/home/thiago/git/clone-tabnews/pages/api/v1/status/index.js
  4:18  error  Found a string with entropy 4.45 : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  no-secrets/no-secrets

✖ 1 problem (1 error, 0 warnings)
```

Como esse é um plugin do ESLint, podemos usar o mesmo script que faz o lint check.

```bash
npm run lint:eslint:check

# log do terminal
clone-tabnews on  lint-no-secrets
❯ npm run lint:eslint:check

> clone-tabnews@1.0.0 lint:eslint:check
> next lint --dir .


./pages/api/v1/status/index.js
4:18  Error: Found a string with entropy 4.45 : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  no-secrets/no-secrets
```

> 🧠 Nem precisamos alterar nada no workflow para o CI.

Pra ver se isso é verdade, vou fazer um commit forçado, seguido por um push, pra ver se a action vai pegar lá no GitHub.
