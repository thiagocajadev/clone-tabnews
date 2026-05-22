# ⛔ Erros Customizados

O erro não é nada mais que um objeto comum no javascript.

Ele vem nos ajudar quando há problemas, indicando o que precisa ser resolvido para tudo normalizar.

O **caminho de exceção** deve ser um dos pilares em qualquer projeto, pois trabalhamos sempre em 2 caminhos:

- **O caminho feliz:** onde tudo flui como esperado.
- **E o caminho triste (haha):** onde acontece algo inesperado, desviando o fluxo padrão.

```js
// criado arquivo temporário teste.js na raiz
// só pra forçar o fluxo de exceção
console.log("Essa linha executou?");

// pega o exit code no terminal
echo $? // saida: 0 - saiu com sucesso
```

Agora criando um método que nao existe pra forçar o erro.

```js
console.log("Essa linha executou?");
user.save(); // não existe
```

```bash
# log terminal
# executa o console log, mas depois entra no erro
❯ node teste.js
Essa linha executou?
/home/thiago/git/clone-tabnews/teste.js:2
user.save();
^

ReferenceError: user is not defined
    at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:2:1)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
    at node:internal/main/run_main_module:28:49

Node.js v18.20.8
```

Agora, se inverter o `console.log` com `user.save()`, é apenas gerado erro e a execução não continua, nem mostra mais o resultado do console.log

## Entendendo a mecânica

Existem duas mecânicas principais que lidam com exceções.

A primeira é o lançamento do erro, exibindo as informações do que aconteceu no fluxo do processo.

E a segunda é o empilhamento do erro, passando por todas as camadas e abstrações nos scripts esperando ser capturada. Caso não haja a captura e tratamento, o processo é encerrado.

**Resumindo de forma técnica:**

Existem duas mecânicas principais no tratamento de exceções:

Lançamento (throw):
Quando algo inesperado ocorre, uma exceção é lançada. Esse lançamento contém informações úteis, como a mensagem de erro, tipo da exceção e, em alguns casos, a stack trace. Isso serve para indicar que o fluxo normal foi interrompido por um problema.

Propagação (empilhamento):
Após o lançamento, a exceção sobe (propaga) pela pilha de chamadas, passando por todas as camadas e abstrações do código. Esse empilhamento continua até que a exceção seja capturada (try/catch). Se não houver captura em nenhuma camada, a aplicação é encerrada com erro.

Esse modelo permite separar responsabilidade: camadas inferiores apenas lançam o erro, enquanto camadas superiores decidem como lidar (exibir mensagem, registrar log, encerrar, etc.).

### Lançando com throw

Vamos lançar uma exceção.

```js
throw true;
console.log("Essa linha executou?");
```

```bash
# saída na console
❯ node teste.js

/home/thiago/git/clone-tabnews/teste.js:1
throw true;
^
true
(Use `node --trace-uncaught ...` to show where the exception was thrown)

Node.js v18.20.8

# código de saída 1 - erro genérico
❯ echo $?
1
```

### Lançando e tratando com try catch

Agora vamos capturar esse erro genérico com um bloco **try/catch**.

```js
// o código dentro do bloco try é avaliado.
// dentro do bloco de código catch, vem o código para tratar o erro avaliado pelo try.
try {
  throw true;
  console.log("Essa linha executou?");
} catch (error) {
  console.log(error);
}

// saída terminal
❯ node teste.js
true
```

Explicação:

O **bloco try** executa seu conteúdo até que algo cause um erro (neste caso, throw true).

O **throw** interrompe imediatamente a execução do **bloco try** e transfere o controle para o catch.

O valor passado no **throw** (neste caso, **true**) é **injetado no parâmetro error** do catch.

A linha console.log("Essa linha executou?") nunca será executada, pois está **após o throw**.

O catch apenas **imprime o valor capturado**, que foi lançado no throw.

O código de saída na console é 0, indicando um fluxo padrão para encerramento.

> Usando console.log(typeof error), obtemos o tipo do erro, no caso do true, boolean

```js
// testando string
try {
  throw "teste de string";
  console.log("Essa linha executou?");
} catch (error) {
  console.log(error);
  console.log(typeof error);
}

// saída
❯ node teste.js
teste de string
string

// testando o lançamento de um objeto
try {
  throw {
    mensagem: "Mensagem de erro",
    motivo: "Faltou o parâmetro X",
  };
  console.log("Essa linha executou?");
} catch (error) {
  console.log(error);
  console.log(typeof error);
}

// saída
❯ node teste.js
{ mensagem: 'Mensagem de erro', motivo: 'Faltou o parâmetro X' }
object
```

### Função construtora no javascript Error

Como o throw não está relacionado diretamente a erros, o javascript possui uma função especifica para erros.

```js
// declaração
new Error();

// testando
try {
  const error = new Error();
  console.log(error);
} catch (error) {
  console.log(error);
  console.log(typeof error);
}

// saída. Essa propriedade especial exibe a toda pilha de erro (stack)
❯ node teste.js
Error
    at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:2:17)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
    at node:internal/main/run_main_module:28:49
```

Analisando a mensagem de erro, a primeira sempre é o mais próximo de onde o erro foi gerado.

## Padronizando a captura de erros

Iniciando com um exemplo simples, já que qualquer coisa no try será capturada.

```js
function salvarUsuario(input) {
  // se não informar a entrada, lança o erro
  if (!input) {
    throw "error-input-undefined";
  }
}

try {
  // como não foi informado o input, vai lançar a string de erro
  salvarUsuario();
} catch (error) {
  console.log(typeof error.stack);
  console.log(typeof error);
}

// saída
❯ node teste.js
undefined // não temos nada na stack, dificil analisar
string
```

Comparando exatamente na captura o erro lançado para exibir na console

```js
function salvarUsuario(input) {
  if (!input) {
    throw "error-input-undefined";
  }
}

try {
  salvarUsuario();
} catch (error) {
  if (error === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
  }
}

// saída
❯ node teste.js
É necessário enviar um 'input'.
```

> Se no salvarUsuario for enviado um objeto vazio, passa sem problemas na captura. Isso é um problema.

Comparando se o objeto enviado possui a propriedade name

```js
function salvarUsuario(input) {
  if (!input) {
    throw "error-input-undefined";
  }

  if (!input.name) {
    throw "error-name-undefined";
  }
}

try {
  salvarUsuario({});
} catch (error) {
  if (error === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
  }

  if (error === "error-name-undefined") {
    console.log("É necessário enviar o 'name'.");
  }
}

// saída
❯ node teste.js
É necessário enviar o 'name'.
```

Legal temos o problema, mas não temos a stack para indicar a origem do problema com essa abordagem.

```js
if (error === "error-name-undefined") {
  console.log("É necessário enviar o 'name'.");
  console.log(error.stack); // só retorna undefined, não ajudando em nada
}
```

Pra resolver isso,o objeto **Error** do javascript que compartilha todos os pontos de lançamento de erro, detalhando onde estão sendo capturados os erros no código.

```js
function salvarUsuario(input) {
  if (!input) {
    // lança um novo objeto Error. O construtor dele aceita uma string como parâmetro
    throw new Error("error-input-undefined");
  }

  if (!input.name) {
    throw new Error("error-name-undefined");
  }
}

try {
  salvarUsuario({});
} catch (error) {
  // pra comparar a string, acessamos a propriedade message do objeto Error
  if (error.message === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
    console.log(error.stack);
  }

  if (error.message === "error-name-undefined") {
    console.log("É necessário enviar o 'name'.");
    console.log(error.stack);
  }
}

// agora sim, na saída temos a stack
❯ node teste.js
É necessário enviar o 'name'.
Error: error-name-undefined
    at salvarUsuario (/home/thiago/git/clone-tabnews/teste.js:7:11) // linha 7, coluna 11 (qtd caracteres)
    at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:12:3) // linha 12, coluna 3
    // ...
```

> 💡 O VS Code mostra no rodapé qual linha e coluna está o cursor

Agora uma falha grave!

```js
function salvarUsuario(input) {
  if (!input) {
    throw new Error("error-input-undefined");
  }

  if (!input.name) {
    throw new Error("error-name-undefined");
  }

  // esse método não existe
  user.save(input);
}

try {
  // propriedade name preenchida
  salvarUsuario({
    name: "Thiago Carvalho",
  });
} catch (error) {
  if (error.message === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
    console.log(error.stack);
  }

  if (error.message === "error-name-undefined") {
    console.log("É necessário enviar o 'name'.");
    console.log(error.stack);
  }
}

// não saiu nada na console
❯ node teste.js
```

Temos ai um **erro engolido** pelo catch, ficando invisível no sistema! Em produção, caos já estaria instalado por completo.

Pra resolver isso, podemos colocar uma condição genérica, fazendo o `runtime do javascript` pegar qualquer erro não tratado por último no catch.

```js
catch (error) {
  if (error.message === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
    console.log(error.stack);
  }

  if (error.message === "error-name-undefined") {
    console.log("É necessário enviar o 'name'.");
    console.log(error.stack);
  }

  // caso não tenha sido pego no tratamento específico, entra aqui
  console.log("Erro desconhecido");
  console.log(error.stack);
}

// saída
❯ node teste.js
Erro desconhecido
ReferenceError: user is not defined // o método user é indefinido, pois não existe no código
    at salvarUsuario (/home/thiago/git/clone-tabnews/teste.js:10:3)
    at Object.<anonymous> (/home/thiago/git/clone-tabnews/teste.js:14:3)
```

### Melhorando os padrões com Custom Errors

O tratamento está ficando mais profissional, mas é preciso centralizar o lançamento de erros e criar formas para evitar centenas de **IFs** repetitivos que validam apenas strings. Vou continuar em outro documento específico, esse tá gigante. 😃
