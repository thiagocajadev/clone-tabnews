# Criando estrutura para Users

Precisamos criar uma `migration` para criar a tabela no banco de dados. Seguindo o fluxo partindo do endpoint:

![Rota até a migration](img/migration-users-endpoint-ate-a-migration.png)

1. **Rota /api/v1/users**: recebe a requisição HTTP (ex: GET, POST) e vai rotear, mandar a requisição para algum lugar. No caso, o Controller.

1. **Controller**: interpreta a requisição e chama o model certo.

1. **Model**: lida com as regras de negócio e o acesso aos dados.

1. **Migration**: define e atualiza a estrutura do banco (tabelas, colunas). Aqui é feita a persistência dos dados, salvando os mesmos.

## Modificando um arquivo de migração

Apague o arquivo de migração de teste do controle do git.

> ⚠️ Nunca mais altere arquivos de migração, isso bagunça todo o histórico de alterações no banco. Mexendo nele apenas pra fins acadêmicos.

```bash
# remove do git
git rm infra/migrations/1748980342283_test-migrations.js
```

Agora sim, sem nenhum arquivo de teste na migration. Hora de criar uma migration de verdade.

> Sobre convenções de nome, pense sempre no Model como um Molde. Uma forma padrão que produz muitas coisas.
> Essas "muitas coisas" são armazenadas em tabelas, usando Migrations, com nome no Plural. Ex: Users, tbUsers, tbUsuarios, tabela_usuarios.

Resumindo:

- **Model** é no singular. UsuarioModel, UserModel ou apenas User.
- **Migration** é no plural. Ex: Os Usuários são salvos na tabela de Usuários.

Seguindo a convenção do pessoal do Ruby On Rails, a criação de migrations segue sempre: create [nomeDaTabela]

```bash
npm run migrations:create create users
```

Apos criar o template da migration, ajuste o arquivo.

```js
// infra/migrations/1753029002617_create-users.js
exports.up = (pgm) => {
  // cria a tabela users e informa um objeto com a definição das colunas
  pgm.createTable("users", {});
};

// informa o pg migrate para considerar apenas migrações pra cima
exports.down = false;
```

Nossa tabela precisa ficar assim:

| id  | username        | email                    | password |
| --- | --------------- | ------------------------ | -------- |
| 1   | thiagocajadev   | thiago.cajaiba@gmail.com | abc123   |
| 2   | filipedeschamps | filiped@gmail.com        | 123abc   |
| 3   | cursodev        | contato@curso.dev        | 123456   |

Pra criar a primeira coluna, será usado o nome **id**, que é o identificador.

```js
exports.up = (pgm) => {
  pgm.createTable("users", {
    // define o nome da coluna e permite especificar no objeto de config
    // as propriedades da coluna como tipo, tamanho, etc.
    id: {
      type: "uuid",
    },
  });
};
```

**UUID** -> Universally Unique Identifier ou Identificador Unicamente Universal
É uma sequência única de caracteres usada para identificar algo de forma global, sem depender de banco de dados ou sistemas centralizados.
Exemplo: 550e8400-e29b-41d4-a716-446655440000

A principal vantagem do **UUID** é gerar identificadores únicos de forma segura e **imprevisível**. Diferente de IDs sequenciais, ele dificulta tentativas de adivinhação ou exploração de registros, aumentando a segurança do sistema.

> Claro, sempre há vantagens e desvantagens para cada abordagem.
> Em outros casos, pode ser mais interessante um identificador sequencial
> Talvez para performance ou indexação, mas no momento esse atende perfeitamente.

Realizando testes contra o endpoint:

```bash
# users/post substituído por um ".", para compatibilidade
# nos Sistemas Operacionais mais usados
npm run test:watch -- users.post
```

```js
// código temporário de teste
// tests/users/post.test.js
mport orchestrator from "tests/orchestrator.js";
import database from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  // necessário apenas limpeza do banco
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const users = await database.query("SELECT * FROM users;");
      console.log(users.rows);

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
      });
      expect(response.status).toBe(201);
    });
  });
});
```

Uma tabela no banco de dados possui uma propriedade chamada **Primary Key**, que garante identificador único, que pode ser usado para relacionar registros com identificadores em outras tabelas.

```js
// detalhes da migration até o momento
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      // função do pg-migrate para gerar uuid aleatório
      default: pgm.func("gen_random_uuid()"),
    },

    // Como referência, o GitHub limita o nome de usuário a 39 caracteres
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
  });
};

exports.down = false;

// executando o teste
// tests/users/post.test.js
mport orchestrator from "tests/orchestrator.js";
import database from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      await database.query({
        text: "INSERT INTO users (username) VALUES ($1);",
        values: ["thiagocajadev"],
      });
      const users = await database.query("SELECT * FROM users;");
      console.log(users.rows);
    }
      // demais códigos ...
)})});

// log no console
// criado registro na tabela
console.log
    [
      {
        id: '8acae7c6-e3fc-47ed-a5e7-e10cd27bc840',
        username: 'thiagocajadev'
      }
    ]
```

Então basta seguir essa linha de raciocínio, escolhendo o tipo de dado mais adequado para cada coluna da tabela.

> 💡 No caso colunas registrando a data e hora de criação, preferencialmente
> use TIMESTAMP UTC, evitando problemas futuros com fuso horários

## Criando a rota /users

Basta criar um novo diretório em pages. a rota fica assim `api/v1/users`

Pra usar como template, só copiar pra dentro da rota o `index.js` do migrations.

```js
import { createRouter } from "next-connect";
import controller from "infra/controller";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

// só pra retornar 201
async function postHandler(request, response) {
  return response.status(201).json({});
}
```

## Garantindo testes

É preciso certificar que o objeto de retorno fazer testes contra o endpoint, traga os dados com tipos corretos de cada propriedade.

```js
// json de exemplo
{
  id: '40ad9518-c71e-4c2f-8750-c203e4a8e368',
  username: 'thiagocajadev',
  email: 'thiago.cajaiba@gmail.com',
  password: 'senha123',
  created_at: '2025-07-21T14:22:37.298Z',
  updated_at: '2025-07-21T14:22:37.298Z'
}
```

Então, pra checar que o id é um **uuidv4** (esse é o tipo gerado pelo Postgres), vamos usar o módulo

```bash
# instala o módulo na versão exata
npm i -E uuid@11.1.0

# mesmo comando de forma verbosa
npm install --save-exact uuid@11.1.0
```

importando o valor desestruturado no teste:

```js
// Da um apelido para o objeto. Apenas version é muito genérico.
import { version as uuidVersion } from "uuid";
```

## Evoluindo o Controller

```js
import { createRouter } from "next-connect";
import controller from "infra/controller";
// ainda não existe, vamos criar logo mais
import user from "models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  // o que vier do corpo da requisição informado pelo usuário vem aqui
  const userInputValues = request.body;

  // a forma mais simples de criar um usuário? um método create que vem do model
  const newUser = await user.create(userInputValues);

  // depois de criar, só enviar na resposta como JSON, simples assim
  return response.status(201).json(newUser);
}
```

## Criando o Model User

```js
// models/user.js

// no primeiro momento, apenas o método create
// tunelando as informações vindas da request
async function create(userInputValues) {
  return userInputValues;
}

const user = {
  create,
};

export default user;
```

Fazendo testes até o momento, nada está sendo enviado na requisição. Para especificar qual o tipo de dado está sendo enviado na requisição, usamos a abstração **headers**, passando o tipo de conteúdo

> Content-Type
> O header Content-Type informa ao servidor qual é o formato dos dados enviados no corpo da requisição.

Você está dizendo: "estou enviando dados em JSON".

Sem isso, o servidor pode não entender o body corretamente e rejeitar ou interpretar errado.

### JSON Válido

Para melhorar a base sobre javascript, precisamos deixar claro o que é um **JS Object** e um **JSON**

```js
// esse não é um json válido, é apenas um objeto JavaScript
// 🚫 Inválido porque propriedade não está entre aspas duplas.
{
  propriedade: "valor"
}

// esse é um json válido
// ✅ Válido porque tanto a chave quanto o valor string estão com aspas duplas — como o padrão JSON exige.
{
  "propriedade": "valor"
}
```

📌 JSON (JavaScript Object Notation) parece com objeto JS, mas é mais rígido:

- Só aceita aspas duplas
- Sem comentários
- Chaves e strings com aspas duplas ("") apenas
- Não aceita virgula entre chave e valor, apenas entre pares
- Não aceita vírgula no final do último item.

Mais exemplos:

```js
// não é um json válido, virgula no final da última propriedade
{
  "nome": "Thiago",
  "idade": 36,
}

// é um json válido
// Propriedades e valores de texto entre " " e sem virgula extra ao final
// obs: números são passados normalmente sem aspas duplas
{
  "nome": "Thiago",
  "idade": 36
}
```

Mais um exemplo com a diferenciação:

```js
// Objeto JavaScript
const pessoa = {
  nome: 'Thiago',
  idade: 36,
  ativo: true,
  saudacao: () => console.log('Olá!'),
  mensagem: `Olá, ${nome}`
  aceita_null: null,
  endereco: undefined
};

// JSON (válido como string JSON)
{
  "nome": "Thiago",
  "idade": 36,
  "ativo": true
  "mensagem": "Olá, Thiago"
  "aceita_null": null
}
```

Principais diferenças entre **JavaScript Object** e **JSON**:

| Característica            | JavaScript Object                  | JSON                                                |
| ------------------------- | ---------------------------------- | --------------------------------------------------- |
| Chaves com aspas          | Opcional                           | **Obrigatório usar aspas duplas**                   |
| Strings                   | Aspas simples, duplas ou crase     | **Somente aspas duplas**                            |
| Aceita `undefined`        | ✅ Sim                             | ❌ Não                                              |
| Aceita funções            | ✅ Sim (`() => {}`)                | ❌ Não                                              |
| Aceita comentários        | ✅ Sim (`//` ou `/* */`)           | ❌ Não                                              |
| Suporte a template string | ✅ Sim (`` `Texto ${variavel}` ``) | ❌ Não                                              |
| Uso típico                | Código JavaScript                  | Transmissão/armazenamento de dados                  |
| Tipos válidos             | Todos do JS                        | Apenas string, número, boolean, null, objeto, array |

Resumindo: **Objeto JavaScript** é para criar códigos no JS. Já o **JSON** é para troca de dados.

## Enviando teste POST

Fazendo um `fetch`, buscando os dados

```js
// trecho de tests/users/post.test.js
// adicionado tipo de conteúdo no cabeçalho, especificando JSON
// no body, passando um objeto javascript para JSON, usando o método
// JSON.stringify
const response = await fetch("http://localhost:3000/api/v1/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "thiagocajadev",
    email: "thiago.cajaiba@gmail.com",
    password: "senha123",
  }),
});
```

Retorno no console, agora os dados são passados na requisição

```js
userInputValues: {
  username: 'thiagocajadev',
  email: 'thiago.cajaiba@gmail.com',
  password: 'senha123'
}

// só tunelou os dados, ainda não salva no banco
newUser: {
  username: 'thiagocajadev',
  email: 'thiago.cajaiba@gmail.com',
  password: 'senha123'
}
```

## Atualizando o model User

```js
// movida lógica de insert do teste pro models/user.js
import database from "infra/database";

async function create(userInputValues) {
  // passa os valores de forma dinâmica com base no objeto recebido
  const results = await database.query({
    text: `
      INSERT INTO 
        users (username, email, password)
      VALUES 
        ($1, $2, $3)
      ;`,
    values: [
      userInputValues.username,
      userInputValues.email,
      userInputValues.password,
    ],
  });

  // como o retorno vem sempre em forma de um array
  // e esse insert retorna apenas 1 registro,
  // tudo bem retornar apenas a primeira posição do array
  return results.rows[0];
}
```

Por padrão, o Postgres não retorna no log Operações INSERT, UPDATE e DELETE, para economizar recursos entre o cliente e servidor. Para forçar isso, pode ser incluído ao final da query a instrução **RETURNING**.

```js
INSERT INTO
  users (username, email, password)
VALUES
  ($1, $2, $3)
RETURNING
  *
```

O asterisco \* representa o retorno de todas as colunas da nova linha inserida.

Realizando testes:

```js
// retorno na console com o registro completão
newUser: {
  id: '9c6014a0-3ff0-4cc1-a328-95a47a9fd147',
  username: 'thiagocajadev',
  email: 'thiago.cajaiba@gmail.com',
  password: 'senha123',
  created_at: 2025-07-21T16:08:35.477Z,
  updated_at: 2025-07-21T16:08:35.477Z
}
```
