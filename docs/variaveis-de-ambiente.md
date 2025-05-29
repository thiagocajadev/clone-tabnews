# 🛢️ Banco de Dados

Seguindo as configurações realizadas no Docker, vamos continuar evoluindo a configuração para um acesso profissional ao PostgreSQL.

## 📦 Instalando o `pg`

O `pg` é um client que permite executar comandos e scripts no PostgreSQL via Node.js:

```bash
npm install pg@8.11.3
```

### 🔁 Subindo rapidamente o ambiente de testes

```bash
npm run dev               # roda o servidor web
npm run test:watch        # roda o jest (agora com --watchAll, testando tudo)
docker compose -f infra/compose.yaml up -d  # sobe o docker em segundo plano com o banco de dados
docker compose -f infra/compose.yaml down # baixa o docker, parando o banco
```

---

## 📜 Preparando o `database.js`

Vamos seguir o raciocínio usando **TDD**, importando o módulo `database` no endpoint para que o teste nos diga o que falta implementar:

```js
// api/v1/status/index.js
import database from "../../../../infra/database.js";

function status(request, response) {
  response.status(200).json({
    chave: "o status está ok!",
  });
}

export default status;
```

Nesse ponto, teremos **dois logs no terminal para análise**:

![Erro status code 500](img/erro-interno-cod-500.png)

- No log do servidor Web (Next.js): `Module not found` — o arquivo ainda não existe.
- No log de testes do Jest: status code `500` — representa erro interno no servidor.

Esses erros indicam que o banco de dados ainda está indisponível ou não implementado.

---

## 📁 Criando o arquivo `database.js`

Mesmo com um conteúdo vazio, só o fato de o arquivo existir já permite que os testes passem.

```js
// infra/database.js
export default {};
```

Para enxergar o que está sendo importado no endpoint, adicione um `console.log(database)`:

```js
// api/v1/status/index.js
import database from "../../../../infra/database.js";

function status(request, response) {
  console.log(database); // imprime o que está sendo retornado pelo módulo
  response.status(200).json({
    chave: "o status está ok!",
  });
}

export default status;
```

Log do servidor web:

```bash
wait  - compiling...
event - compiled successfully in 172 ms (38 modules)
{} // aqui o objeto ainda está vazio
```

---

## 🧱 Adicionando estrutura ao módulo

Vamos agora começar a estruturar o arquivo, criando a definição de uma função `query`, mesmo que ainda não implementada:

```js
// infra/database.js
export default {
  query: query,
};

// Aqui só temos a definição da propriedade 'query' no objeto exportado,
// mas ainda precisamos criar a função 'query' de fato para ela funcionar.
```

---

## 🔌 Criando a abstração com node-postgres (`pg`)

Agora sim, criamos a função que faz a conexão e consulta no banco usando o client do `pg`.

```js
// infra/database.js
// Aqui importamos o Client da biblioteca 'pg'
import { Client } from "pg";

// Definimos a função assíncrona que realiza a consulta no banco
// - conecta no banco
// - executa a query recebida por parâmetro
// - encerra a conexão
// - retorna o resultado
async function query(queryObject) {
  const client = new Client();
  await client.connect();
  const result = await client.query(queryObject);
  client.end(); // finaliza a conexão para evitar conexões penduradas
  return result;
}

export default {
  query: query,
};
```

---

## 🧪 Testando com uma query simples

Agora podemos utilizar o módulo `database` para fazer consultas no banco:

```js
// api/v1/status/index.js
import database from "../../../../infra/database.js";

// a função passou a ser assíncrona, pois precisa aguardar o retorno do banco
async function status(request, response) {
  // consulta simples para verificar se a conexão está funcionando
  const result = await database.query("SELECT 1 + 1;");
  console.log(result); // exibe o retorno completo
  response.status(200).json({
    chave: "o status está ok!",
  });
}

export default status;
```

---

## 🔐 Configurando credenciais provisórias

Nesse ponto, um erro será gerado porque ainda **não definimos as credenciais** para o PostgreSQL.

Vamos incluir essas informações de forma provisória diretamente no código (não recomendado para produção):

```js
// infra/database.js
import { Client } from "pg";

async function query(queryObject) {
  // informando credenciais em texto puro provisoriamente
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: "postgres",
    password: "local_password",
  });
  await client.connect();
  const result = await client.query(queryObject);
  client.end();
  return result;
}

export default {
  query: query,
};
```

---

## 🔎 Melhorando a visualização do retorno

Para deixar o log mais limpo, podemos filtrar e exibir apenas os dados da consulta:

```js
// api/v1/status/index.js
import database from "../../../../infra/database.js";

async function status(request, response) {
  const result = await database.query("SELECT 1 + 1 AS Sum;"); // definimos o nome da coluna como 'Sum'
  console.log(result.rows); // mostra apenas o array de resultados
  response.status(200).json({
    chave: "o status está ok!",
  });
}

export default status;
```

---

Com isso, temos a conexão funcionando, a consulta sendo executada, e o retorno do banco já visível no log.  
A próxima etapa será substituir essas credenciais fixas por variáveis de ambiente com `.env` — deixando o código mais seguro e reutilizável.
