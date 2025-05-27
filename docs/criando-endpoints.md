# 🔌 Criando Endpoints

Qualquer endereço na internet pode ser chamado de endpoint — como curso.dev, google.com ou github.com/thiagokj. Também é comum ouvirmos o termo rota nesse contexto.

Mas, geralmente, quando falamos em endpoint, estamos nos referindo a um endereço de API.

🧠 API — é uma interface de comunicação de dados. Ou seja, ela serve para troca de informações, normalmente no formato JSON (objetos JavaScript).

Sim, propositalmente não usei aqui a sigla completa — Interface de Programação de Aplicações — porque o mais importante é entender o objetivo:

🤖 Uma API é feita para ser lida por softwares, robôs e scripts, e não por pessoas.

👀 Já uma interface web (como um site) é voltada para seres humanos, com elementos visuais: menus, textos, botões e links para leitura.

## Rotas no Next.js

O roteamento no Next.js é feito de forma automática e dinâmica.
Basta criar arquivos dentro da pasta `pages/api`, como por exemplo: `pages/api/nome-da-rota.js`.

O nome do arquivo se torna o endpoint da API, e o Next cuida do resto para que você não precise configurar rotas manualmente.

Exemplo:

```js
// pages/api/status.js
// foi criada uma rota pública para acesso ao site.
// ex: clone-tabnews.thiagokj.site/api/status
function status(request, response) {}

// o Next injeta o request e o response aqui.
// request -> solicitação externa, passando parâmetros para API
// response -> retorno de dados da API
```

Melhorando o exemplo:

```js
function status(request, response) {
  // caso seja acessando o endpoint, o mesmo envia a frase abaixo.
  // porém esse envio não sabe interpretar qual chartset (teclado de origem), e ai quebra a acentuação e outros caracteres.
  response.status(200).send("o status está ok!");
}

// informa que a propriedade é a função de entrada padrão pra esse endpoint
export default status;
```

Para padronizar a resposta de dados com charset mais usado, podemos fazer assim:

```js
function status(request, response) {
  // usando json, temos o charset utf-8, que ajuda nessa questão de acentuação
  // o json é sempre assim, chave: valor
  response.status(200).json({
    chave: "o status está ok!",
  });
}

// informa que a propriedade é a função de entrada padrão pra esse endpoint
export default status;
```
