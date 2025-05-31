# 🛢️ Vazamento de Conexões

Ao realizar consultas nas estatísticas do banco de dados — no caso do Postgres — é necessário filtrar apenas a base em uso:

```sql
SELECT count(*)::int FROM pg_stat_activity WHERE datname = local_db
```

Nos testes de endpoint, uma forma inicial de obter essa informação seria:

```js
// Note que usamos aspas simples ao redor de local_db para evitar conflitos com as aspas duplas
const databaseOpenedConnectionsResult = await database.query(
  "SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';",
);

const databaseOpenedConnectionsValue =
  databaseOpenedConnectionsResult.rows[0].count;
```

Porém, como o nome da base fica fixo na consulta, essa abordagem não é flexível. Precisamos melhorar.

## 💉 SQL Injection

Enviar parâmetros dinâmicos para uma query exige atenção, pois há o risco de ataques que alteram o comportamento da consulta — o temido _SQL Injection_ — o que pode causar grandes problemas no sistema. 🎆

Continuando o exemplo, vamos passar o valor de uma variável JavaScript dentro da query:

```js
const databaseName = "local_db";
const databaseOpenedConnectionsResult = await database.query(
  "SELECT count(*)::int FROM pg_stat_activity WHERE datname = '" +
    databaseName +
    "';",
);
```

Perceba como essa concatenação com vários símbolos (+, aspas, etc) torna o código difícil de ler e propenso a erros.

### Melhorando com Template Literals

Uma forma moderna e mais legível de montar strings dinâmicas em JavaScript é utilizando _Template Literals_ (ou _Template Strings_), usando o acento grave (`` ` ``):

```js
const databaseName = "local_db";
const databaseOpenedConnectionsResult = await database.query(
  `SELECT count(*)::int FROM pg_stat_activity WHERE datname = '${databaseName}';`,
);
```

Agora a interpolação de variáveis ocorre de forma mais intuitiva, através do `${}`.

### O perigo de dados dinâmicos

Apesar de mais legível, essa abordagem continua vulnerável a _SQL Injection_. Vamos simular um cenário real:

```js
// Nosso endpoint já possui dois parâmetros: request e response
async function status(request, response) { ... }

// No teste, passamos parâmetros via query string (chave e valor na URL)
test.only("Teste SQL Injection", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status?dataBaseName=local_db");
  expect(response.status).toBe(200);
});
```

Agora no endpoint, capturamos o valor da query string:

```js
async function status(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseInfo = await getDatabaseInfo();

  const dataBaseName = request.query.dataBaseName; // vindo da URL
  console.log(`Banco de dados selecionado: ${dataBaseName}`);
  ...
}
```

Se alguém mal-intencionado enviar comandos SQL via query string, teremos problemas:

```js
test.only("Teste SQL Injection", async () => {
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=local_db");
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=");
  await fetch("http://localhost:3000/api/v1/status?dataBaseName=;");
  await fetch(
    "http://localhost:3000/api/v1/status?dataBaseName='; SELECT pg_sleep(4); --",
  );
});
```

Isso geraria as seguintes queries no banco:

```
"SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'local_db';"
"SELECT count(*)::int FROM pg_stat_activity WHERE datname = '';"
"SELECT count(*)::int FROM pg_stat_activity WHERE datname = '';';"
"SELECT count(*)::int FROM pg_stat_activity WHERE datname = ''; SELECT pg_sleep(4); --';"
```

No último caso, comandos arbitrários são executados após o ponto e vírgula, o que poderia permitir até mesmo:

> 🛑 DROP DATABASE — apagando todo o banco de dados!

### Bloqueio manual? Não.

Tentar bloquear manualmente palavras-chave na entrada (ex: `SELECT`, `ALTER`, `DROP`) não é uma boa prática, pois há muitos casos extremos. Por exemplo:

> Existe uma cidade brasileira chamada _Alter do Chão_ — e o simples uso de "ALTER" poderia bloquear um input legítimo.

## 🧱 A solução segura: Parameterized Queries

A forma correta de proteger o banco é através de _Query Sanitization_, utilizando consultas parametrizadas.

O PostgreSQL suporta nativamente _Parameterized Queries_, que separam o SQL estático dos valores dinâmicos:

```js
async function status(request, response) {
  ...
  const dataBaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [dataBaseName],
  });
}
```

Agora:

- O SQL está fixo e não é mais alterado pelos dados externos.
- Os valores dinâmicos são passados separadamente no array `values`.
- O `$1` representa o primeiro valor do array, garantindo total proteção contra _SQL Injection_.

### Teste do endpoint

Durante os testes, observamos um comportamento:

```powershell
  Expected: "1"
  Received: 26
```

O motivo: ao ocorrer uma falha de execução na query, o código não estava fechando a conexão, deixando conexões abertas e gerando inconsistências no resultado.

```js
// trecho do database.js
await client.connect();

// passando uma query corrompida: SEL ECT count(*)::int FROM pg_stat_activity WHERE datname = $1;
const result = await client.query(queryObject); // falha ocorre aqui

client.end(); // nunca chega aqui se falhar antes
return result;
```

## 🎯 Tratando exceções com Try/Catch/Finally

Para garantir que a conexão seja sempre encerrada, mesmo com erro, usamos o bloco `try/catch/finally`:

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

- **try**: executa o fluxo principal.
- **catch**: captura e trata qualquer erro ocorrido.
- **finally**: sempre será executado, independentemente de sucesso ou falha, garantindo o encerramento da conexão.

---

Agora o código está:

✅ Mais seguro  
✅ Mais limpo  
✅ Protegido contra SQL Injection  
✅ Com tratamento correto de exceções e conexões
