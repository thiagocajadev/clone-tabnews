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
