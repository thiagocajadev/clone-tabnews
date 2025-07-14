# Evoluindo o tratamento de erros

Para simular uma falha de conexão com o banco, alterei o usuário de conexão.

```bash
# log console do servidor web
# é indicado onde ocorreu o erro e seu tipo
 ⨯ infra/database.js (13:12) @ end
 ⨯ TypeError: Cannot read properties of undefined (reading 'end')
    at Object.query (webpack-internal:///(api)/./infra/database.js:18:16)

# o runtime do javascript lançou erro pois o finally sempre tem precedência
11 |     throw error;
  12 |   } finally {
> 13 |     client.end();
     |            ^
  14 |   }
  15 | }

# log com curl -s http://localhost:3000/api/v1/status | jq
❯ curl -s http://localhost:3000/api/v1/status | jq
jq: parse error: Invalid numeric literal at line 1, column 10

# log com curl http://localhost:3000/api/v1/status
# aqui vem todo o hmtl do erro, bem complicado de analisar, abaixo só um trecho
❯ curl http://localhost:3000/api/v1/status
pageProps":{"statusCode":500}},"page":"/_error","query":{},"buildId":"development","isFallback":false,"err":{"name":"TypeError","source":"server","message":"Cannot read properties of undefined (reading 'end')","stack":"TypeError: Cannot read properties of undefined (reading 'end')\n   at Object.query (webpack-internal:///(api)/./infra/database.js:18:16)
```

Cavucando esses logs, temos acesso onde o erro está borbulhando.

```js
// database.js
async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    // não da pra fechar uma conexão que nunca foi aberta
    // fazendo um novo erro borbulhar na frente dos processos
    client.end();
  }
}
```

Vamos deixar o tratamento de erro mais forte, pra ele lidar com esse tipo de situação. Do simples ao sofisticado.

```js
// abrançado o método status da api com try/catch
// api/v1/status/index.js
import database from "infra/database";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    //... demais códigos ...
  } catch (error) {
    // agora é indicado no servidor web onde aconteceu o erro
    console.log("\n Erro dentro do catch do Controller");
    console.log(error);
    // é devolvido para o client curl um json formatado com o erro
    response.status(500).json({ error: "Internal Server Error" });
  }
}
```

Olhando os logs do servidor web e curl

```bash
# trecho do log do next
Erro dentro do catch do Controller
TypeError: Cannot read properties of undefined (reading 'end')
    at Object.query (webpack-internal:///(api)/./infra/database.js:19:16)

# log curl
❯ curl -s http://localhost:3000/api/v1/status | jq
{
  "error": "Internal Server Error"
}
```

Bem mais limpo e objetivo.

## Centralizando erros em errors.js

```js
export class InternalServerError extends Error {
  // desestruturando o objeto no construtor, pegando a causa do erro
  constructor({ cause }) {
    super("Um erro interno não esperado aconteceu.", {
      // aqui podemos simplificar, pois o valor da propriedade será vinculado conforme o nome
      cause: cause,
    });
  }
}

// versão simplificada
export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
  }
}
```

Agora refatorando o controller status

```js
// importando e já desestruturando o objeto pra trazer somente o objeto que será usado
import { InternalServerError } from "infra/errors";

// melhorando o catch, criando um objeto de erro publico
// injetando o erro na propriedade com a causa
catch (error) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do Controller");
  console.log(publicErrorObject);

  response.status(500).json({ error: "Internal Server Error" });
}
```

Executando pra ver o que acontece.

```bash
# Temos agora o objeto com o erro destacado
Erro dentro do catch do Controller
InternalServerError: Um erro interno não esperado aconteceu.
    at status (webpack-internal:///(api)/./pages/api/v1/status/index.js:35:35)
#... mais informações
# destacada a propriedade cause, com a razão do erro
 [cause]: TypeError: Cannot read properties of undefined (reading 'end')
      at Object.query (webpack-internal:///(api)/./infra/database.js:19:16)
```

Seguindo essa lógica, podemos encadear todos os erros que estão sendo causados, gerando uma visão muito organizada da stack de erros.

> ⚠️ Na questão de segurança, nem toda informação pode ser retornada para o client publico.

Todas as propriedades de um objeto no javascript são por padrão **enumeráveis**. Elas podem ser listadas em um loop facilmente

```js
// exemplo definindo a mecânica de listagem
const person = {
  firstName: "Thiago", // enumerable: true
  lastName: "Carvalho", // enumerable: false (posso definir pra não ser enumerada)
};

for (const key in person) {
  console.log(key);
}

// firstName
```

O `JSON.stringify()` usa essa mecânica para criar uma string para enviar na resposta do endpoint. Por baixo dos panos o `response.status(500).json()` usa esse método. Refatorando:

```js
// exibindo o publicErrorObject
response.status(500).json(publicErrorObject);

// por padrão ele retorna um objeto em branco, então temos que configurar o retorno da conversão do json, sobrescrevendo o método toJSON
export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
  }

  // como a classe herda de error, temos acesso a seus métodos e propriedades
  toJSON() {
    return {
      // capturamos a mensagem definida na primeira propridade, que é message
      message: this.message,
    };
  }
}

// saída na console
❯ curl -s http://localhost:3000/api/v1/status | jq
{
  "message": "Um erro interno não esperado aconteceu."
}
```

Agora para padronizar o retorno de erros, basta definir todas as propriedades no retorno

```js
export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
    this.name = "InternalServerError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
    };
  }
}

// saída
❯ curl -s http://localhost:3000/api/v1/status | jq
{
  "name": "InternalServerError",
  "message": "Um erro interno não esperado aconteceu."
}
```

Show! Temos o erro customizado pronto! Agora usando o navegador como client, o erro virá de forma organizada e bem direcionada sobre o que está ocorrendo.

## Ajustando o finally

Agora, vamos colocar um pans

```js
catch (error) {
  console.log("\n Erro dentro do catch do Database.js");
  console.log(error);
  throw error;
} finally {
  client?.end(); // `?.` (Optional Chaining) – JavaScript
}
```

O operador `?.` evita erro ao acessar algo que pode ser `null` ou `undefined`.

Exemplo real:

```js
finally {
  client?.end(); // só chama end() se client existir
}
```

Equivalente a:

```js
if (client !== null && client !== undefined) {
  client.end();
}
```

Vantagens:

- Evita erro: `Cannot read property 'end' of undefined`
- Código mais limpo e seguro
- Funciona com propriedades e métodos

Importante:

`?.` **não trata exceções** internas do método chamado.

```bash
# agora o processo não borbulha até sair com código de erro
# os erros estão sendo tratados corretamente
Erro dentro do catch do Controller
InternalServerError: Um erro interno não esperado aconteceu.
  at status (webpack-internal:///(api)/./pages/api/v1/status/index.js:35:35)
  # varios códigos ocultados aqui...
  action: 'Entre em contato com o suporte.',
  statusCode: 500,
  [cause]: error: password authentication failed for user "local_user2"
```
