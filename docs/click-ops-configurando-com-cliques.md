# 🖱️ ClickOps

ClickOps -> Click Operations ou Operações por cliques é uma prática de configurar um serviço por interface, só marcando e clicando nas coisas.

Essa é uma forma mais simples e comum de configurar via interface gráfica.

## 🐘 Configurando Neon

Criar uma conta no Neon é bem simples

Podemos especificar as seguintes informações após criar uma contata gratuita.

- Nome do projeto: `clone-tabnews`
- Versão do Postgres: `16`
- Provedor de Nuvem: `AWS` (Azure opcional)
- Região: `São Paulo`

> Até a data de hoje, o formulário apresentava apenas essas informações

Após isso, acesse o painel e procure `Connect to your database`.

Aqui é possível escolher configurar a conexão por uma `connection string` ou especificando como por parâmetros, via variáveis de ambiente.

### 🔒 SSL e a segurança da conexão

Testando as credenciais no `.env.development` e subindo localmente, é apresentado erro tanto ao abrir a pagina web, quanto no console do terminal:

```powershell
error: connection is insecure (try using `sslmode=require`)
```

Isso ocorre por que até o momento, estávamos trafegando somente via http. O trafego não estava seguro e criptografado, expondo os dados nas requisições e respostas.

O SSL (Secure Socket Layer), é uma camada de segurança que cuida disso. Pra resolver essa questão, basta habilitar o uso do ssl no arquivo de ambiente.

```js
// trecho database.js
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: true, // aqui habilita o uso da camada de segurança
});
```

Mas e se precisar usar o banco local pra testes? Essa camada não se aplica a ambiente local.

Pra isso pode ser verificado com ternário qual ambiente está sendo executada a aplicação:

```js
// trecho database.js
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === "development" ? false : true; // agora é feita verificação do ambiente
});
```
