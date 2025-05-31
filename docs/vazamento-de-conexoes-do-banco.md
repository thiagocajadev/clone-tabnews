# 🛢️ Vazamento de Conexões

Fazendo consultas nas estatísticas do banco de dados, no caso do Postgres, é necessário filtrar a base em uso.

```sql
SELECT count(*)::int FROM pg_stat_activity WHERE datname = local_db
```

Então uma das formas de retornar essa informação nos testes do endpoint seria:

```js
// veja que usamos aspas simples para identificar o local_db, evitando conflito com aspas duplas
const databaseOpenedConnectionsResult = await database.query(
  "SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';",
);

const databaseOpenedConnectionsValue =
  databaseOpenedConnectionsResult.rows[0].count;
```

Como essa informação ficaria fixa na consulta, não é legal, temos que partir pra outra abordagem.

## 💉 SQL Injection

Enviar parâmetros para query requer atenção e cuidado, visto que há possibilidade de passar comandos que alteram a consulta original, podendo gerar uma catástrofe no sistema .🎆

Continuando com o exemplo da query, vamos pegar o valor de uma variável javascript e passar ele:

```js
const databaseName = "local_db";
const databaseOpenedConnectionsResult = await database.query(
  "SELECT count(*)::int FROM pg_stat_activity WHERE datname = '" +
    databaseName +
    "';",
);
```

Esse monte de escape e concatenação com aspas e símbolos de mais dificultam a escrita e leitura.

A forma mais moderna pra melhorar isso é usando `Template Literals`, chamado `Template Strings`.

Basta usar o simbolo de `acento grave` pra ajustar:

```js
const databaseName = "local_db";
const databaseOpenedConnectionsResult = await database.query(
  `SELECT count(*)::int FROM pg_stat_activity WHERE datname = databaseName;`,
);
```

Veja que agora não é preciso mais ficar 'grudando' parâmetros na string (imagine +10 parâmetros fazendo isso).

Ela se tornou uma string especial, que aceita expressões e `placeholders`. Ex:`${}` .

```js
const databaseName = "local_db";
const databaseOpenedConnectionsResult = await database.query(
  `SELECT count(*)::int FROM pg_stat_activity WHERE datname = '${dataBaseName}';`,
);
```

Agora sim estamos passando a variável pra dentro da query, e o javascript vai saber `interpolar` o valor, trocando o placeholder pela variável.

O problema de passarmos valores dinâmicos é a brecha para ataques. Vamos simular aqui:

```js
// nosso método possui 2 parâmetros, request e response
// até agora não tinhas usados o request, então bora usar, pois ele traz tudo o que vier na requisição
async function status(request, response) {...}

// aqui nos passamos o parâmetros via query string
// basta colocar uma interrogação ao final da URI, passando chave e valor
test.only("Teste SQL Injection", async () => {
  const response = await fetch(
    "http://localhost:3000/api/v1/status?dataBaseName=local_db",
  );
  expect(response.status).toBe(200);
});
```

Então o método que faz a leitura e uso do request fica assim:

```js
async function status(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseInfo = await getDatabaseInfo();

  const dataBaseName = request.query.dataBaseName; // retorna da Uri
  console.log(`Banco de dados selecionado: ${dataBaseName}`);
  ...
}
```

Agora, caso alguém queria usar pro mal esse recurso... é complicado isso ai cara.

```js
// Usando a injeção via comandos SQL 👿
// Veja no teste como podem ser passados comandos na request via query string
test.only("Teste SQL Injection", async () => {
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=local_db");
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=");
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=;");
  await fetch(
    "http://localhost:3000/api/v1/status?dataBaseName='; SELECT pg_sleep(4); --",
  );
});

async function status(request, response) {
  ...
  const dOpenedConnectionsResult = await database.query(
    `SELECT count(*)::int FROM pg_stat_activity WHERE datname = ${databaseName};`,
  );

  // Aqui vou colocar os retornos de cada consulta fetch realizada:
  // "SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';"
  // "SELECT count(*)::int FROM pg_stat_activity WHERE datname = '';"
  // "SELECT count(*)::int FROM pg_stat_activity WHERE datname = '';';"
  // "SELECT count(*)::int FROM pg_stat_activity WHERE datname = ''; SELECT pg_sleep(4); --';"
```

O ultimo fetch trata o ponto e virgula do final como comentário, com o uso dos traços, permitindo então qualquer comando.

> 🛑 Essa brecha poderia permitir um DROP DATABASE, apagando todo o banco

Tratar isso de forma manual não é uma boa, tipo bloqueando nomes de palavras chave no request. Ex: SELECT, ALTER, DROP, visto inúmeros casos e variados exceções que podem entrar:

> Existe uma cidade brasileira que chama Alter do Chão... ALTER ja iria quebrar o código

## 🧱 Colocando barreiras

Pra impedir essas falhas, vamos partir pra abordagem de `Query Sanitization` ou seja, melhores práticas na limpeza das consultas. Sem isso, o banco sempre estará em risco.

O `PostgreSQL` oferece um recurso que atende perfeitamente essa questão, trabalhando com `Parameterized Queries`.

Isso é bem simples, basta separar na consulta o que é `texto` e o que são `valores`:

```js
async function status(request, response) {
  ...
  const dataBaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [dataBaseName],
  });
```

Agora passamos um objeto chave e valor, definindo o que é o texto da consulta e marcando os valores dos parâmetros
com o `cifrão + numero sequencial` Ex: `$1` irá receber o `1º parâmetro` informado que é dataBaseName.

Agora testando o retorno das conexões com banco:

```powershell
  Expected: "1"
  Received: 26
```

Por que isso acontece? Porque quando há uma query corrompida ou mal formatada, é gerada `exceção` no método que faz consultas ao banco.

Como não há tratamento de exceções ainda, o método não chega a executar os passos para encerrar a conexão, mantendo a conexão anterior aberta, gastando recursos desnecessários e até podendo travar o acesso ao banco.

```js
// trecho do database.js
await client.connect();

// passando uma query corrompida: SEL ECT count(*)::int FROM pg_stat_activity WHERE datname = $1;
const result = await client.query(queryObject); // da problema aqui

client.end(); // aqui já não é mais executado (caminho triste... eu estou triste agora.)
return result; // pula pra cá e nem devolve na console erro
```

Pra resolver isso, basta usar um bloco `try/catch`.

O `try/catch` está disponível em muitas linguagens de programação e serve pra garantir a execução de um código.

```js
// trecho do database.js
await client.connect();

try {
  const result = await client.query(queryObject);
  return result;
} catch (error) {
  console.log(error);
} finally {
  client.end();
}
```

Resumindo:

- try: executa o fluxo padrão do código (o famoso caminho feliz).
- catch: caso haja qualquer problema no fluxo de execução, retorna o erro.
- finally: essa parte sempre será executada, caso de erro ou não.
