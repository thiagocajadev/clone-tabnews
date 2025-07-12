# Criando Erros Customizados

O JavaScript já possui seus próprios **Erros Customizados**.

O `ReferenceError` apareceu na saída do terminal, quando o método `user` estava indefinido.

> É muito importante separar a mensagem do erro e o tipo do erro

Outros `custom (built-in) errors`:

```js
// Error
// Base genérica de todos os erros – pode ser usada diretamente.
new Error("Mensagem genérica de erro");

// ReferenceError
// Variável ou função não declarada ou fora de escopo.
new ReferenceError("Variável não definida");

// SyntaxError
// Erro de sintaxe no código – geralmente detectado em tempo de parsing.
new SyntaxError("Erro de sintaxe");

// TypeError
// Tipo de dado inesperado ou operação inválida para o tipo. (ex: numero em caixa alta, não dá)
new TypeError("Tipo inválido");

// RangeError
// Um valor está fora de um intervalo aceitável (ex: tamanho de array).
new RangeError("Fora do intervalo permitido");

// EvalError
// Relacionado ao uso incorreto de `eval()` (raro de usar).
new EvalError("Erro de eval");

// URIError
// Uso incorreto das funções encode/decode URI (ex: `decodeURIComponent`).
new URIError("Erro de URI inválida");
```

Refatorando:

```js
function salvarUsuario(input) {
  if (!input) {
    // lançamentos o tipo mais específico
    throw new ReferenceError("É necessário enviar o 'input'.");
  }

  if (!input.name) {
    throw new Error("error-name-undefined");
  }

  user.save(input);
}

try {
  salvarUsuario();
} catch (error) {
  // capturamos o tipo específico
  if (error instanceof ReferenceError) {
    console.log(error);
    return;
  }

  console.log("Erro desconhecido");
  console.log(error.stack);
}

// como é um erro interno, podemos simplificar ainda mais esse trecho
if (error instanceof ReferenceError) {
  console.log(error);
  return;
}
// simplificado
if (error instanceof ReferenceError) {
  throw error;
}

// saída
 node teste.js
/home/thiago/git/clone-tabnews/teste.js:17
  throw error;
  ^

ReferenceError: É necessário enviar o 'input'.
  at salvarUsuario (/home/thiago/git/clone-tabnews/teste.js:3:11)
  // ...
```

Temos então a saída, capturando o objeto que foi lançado, que **borbulhou** até o processo estourar. 🫧

> ReferenceErrors são mais voltados aos programadores, pra serem analisados internamente no sistema.

Para trabalhar com erros no lado do usuário, retornando uma mensagem amigável, podemos usar **TypeErros**.

```js
function salvarUsuario(input) {
  if (!input) {
    throw new ReferenceError("É necessário enviar o 'input'.");
  }

  // Padrão de erros em uma requisição
  if (!input.name) {
    throw new TypeError("Preencha seu nome completo.");
  }

  if (!input.username) {
    throw new TypeError("Preencha seu nome de usuário.");
  }

  if (!input.age) {
    throw new TypeError("Preencha sua idade.");
  }

  user.save(input);
}

try {
  salvarUsuario({}); // enviado objeto vazio
} catch (error) {
  if (error instanceof ReferenceError) {
    throw error;
  }

  if (error instanceof TypeError) {
    console.log(error);
    // no caso de uma resposta a request, poderia retornar o código do erro em um json
    // pra isso temos que criar um erro customizado
    return; // response.status(400).json(error);
  }

  console.log("Erro desconhecido");
  console.log(error.stack);
}

// saída
❯ node teste.js
TypeError: Preencha seu nome completo.
  at salvarUsuario (/home/thiago/git/clone-tabnews/teste.js:7:11)
  at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:22:3)
  // ...
```

## Criando uma classe

JavaScript usa **protótipos para herança**, não classes reais como em C#.
A sintaxe **class** é apenas uma forma mais limpa de escrever a mesma lógica baseada em protótipos.
Por trás, métodos definidos em classes são adicionados no prototype do construtor.

```js
// criado ValidationError que herda as propriedades de Error
// o construtor chama o método super que inicializa todas as propriedades herdadas
// como message e stack
class ValidationError extends Error {
  constructor() {
    super();
  }
}

// então a primeira propriedade do construtor a ser definida é a mensagem,
// virando parte da assinatura da classe
// repassando a propriedade pro super, a maquininha base do Error
// vai rodar com a mensagem definida.
// ferramentas de log e debug são beneficiadas ao utilizar esse padrão
class ValidationError extends Error {
  constructor(message) {
    super(message);
  }
}
```

Agora o ValidationError está funcionando e pode ser adaptado ao código

```js
// criada classe
class ValidationError extends Error {
  constructor(message) {
    super(message);
  }
}

function salvarUsuario(input) {
  if (!input) {
    throw new ReferenceError("É necessário enviar o 'input'.");
  }

  // alterado TypeError para ValidationError
  if (!input.name) {
    throw new ValidationError("Preencha seu nome completo.");
  }

  if (!input.username) {
    throw new ValidationError("Preencha seu nome de usuário.");
  }

  if (!input.age) {
    throw new ValidationError("Preencha sua idade.");
  }

  user.save(input);
}

try {
  salvarUsuario({});
} catch (error) {
  if (error instanceof ReferenceError) {
    throw error;
  }

  // captura o ValidationError
  if (error instanceof ValidationError) {
    console.log(error);
    return; // response.status(400).json(error);
  }

  console.log("Erro desconhecido");
  console.log(error.stack);
}

// saída
❯ node teste.js
ValidationError: Preencha seu nome completo.
  at salvarUsuario (/home/thiago/git/clone-tabnews/teste.js:13:11)
  at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:28:3)
  // ...
```

Pra informar o status code, basta adicionar no construtor uma nova propriedade com a palavra reservada para instancia criada `this`.

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

// catch
if (error instanceof ValidationError) {
  console.log(error.statusCode);
  return; // response.status(400).json(error);
}

// saída
❯ node teste.js
400
```

Agora através das propriedades, devolver ao frontend ficou mais fácil.
