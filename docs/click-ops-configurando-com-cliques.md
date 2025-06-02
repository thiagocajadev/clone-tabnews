# 🖱️ ClickOps

**ClickOps** — abreviação de _Click Operations_ ou _Operações por Cliques_ — é uma prática de configurar serviços por meio da interface gráfica, apenas clicando e preenchendo campos.  
É uma forma simples e bastante comum de configurar sem necessidade de linha de comando.

---

## 🐘 Configurando o Neon

Criar uma conta no **Neon** é bem direto. Após o cadastro gratuito, podemos definir algumas informações:

- Nome do projeto: `clone-tabnews`
- Versão do Postgres: `16`
- Provedor de Nuvem: `AWS` (opção de Azure disponível)
- Região: `São Paulo`

> Até a data deste documento, o formulário apresenta apenas essas opções.

Após a criação, acesse o painel e procure por **Connect to your database**.

Neste ponto, é possível obter a conexão tanto via _connection string_ quanto de forma separada para uso com variáveis de ambiente.

---

### 🔒 SSL e a segurança da conexão

Ao configurar o `.env.development` e tentar rodar localmente, nos deparamos com o seguinte erro, tanto na aplicação web quanto no terminal:

```powershell
error: connection is insecure (try using `sslmode=require`)
```

Isso acontece porque, até o momento, o tráfego de dados estava ocorrendo via HTTP, sem criptografia, o que expõe as informações transmitidas.

O **SSL (Secure Socket Layer)** entra justamente para proteger esse tráfego. Para resolver o problema, basta habilitar o SSL na configuração do banco:

```js
// database.js
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: true, // habilita a camada de segurança SSL
});
```

#### ✅ Tratando o ambiente local

Durante o desenvolvimento local, o SSL pode não ser necessário. Podemos usar um operador ternário para habilitar ou não o SSL de acordo com o ambiente:

```js
// Exemplo genérico de ternário:
condição ? valorSeVerdadeiro : valorSeFalso;

// Aplicado ao caso:
process.env.NODE_ENV === "development" ? false : true;
```

> No ternário, o primeiro valor define o que ocorre quando a condição é verdadeira. No nosso caso: se for ambiente de desenvolvimento, desabilitamos o SSL.

Assim, o código final fica:

```js
// database.js
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === "development" ? false : true,
});
```

---

## 🌊 Configurando Digital Ocean

Na **Digital Ocean**, o processo é bem semelhante:

1. Complete o cadastro.
2. Crie o banco de dados e renomeie a instância para `production-postgres`.

> 🚩 Boa prática: utilizar prefixos como `production-`, `test-`, `qa-` ajuda a organizar os ambientes e evita erros em operações futuras.

Após o setup inicial, prossiga desabilitando a opção de conexão segura (SSL), já que faremos a conexão através da Vercel, fora da rede privada da Digital Ocean.

Agora, copie os dados fornecidos e configure nas variáveis de ambiente da Vercel:

![Variáveis de Ambiente](img/vercel-variaveis-de-ambiente.png)

> Na imagem, os dados estão simulando ambiente local. Basta ajustar com as credenciais reais.

---

### 🚫 Erro 500 ao testar conexão

Durante os testes, ao acessar a aplicação, surgiu o erro:

![Erro 500 certificado digital](img/erro-500-vercel-digital-ocean-ca.png)

O problema está relacionado ao **certificado digital**. A Digital Ocean exige o uso de um **certificado autoassinado (self-signed certificate)**.

---

### ✍🏻 Tratando o Certificado Autoassinado

Para simular e testar localmente o uso do certificado:

```js
// database.js
const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: getSSLValues(), // abstraímos a lógica para uma função separada
});

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    // Se a variável de ambiente POSTGRES_CA existir, usamos o conteúdo dela
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  // Em outros casos, mantemos o SSL habilitado
  return process.env.NODE_ENV === "development" ? true : true;
}
```

#### 🔄 Preparando o conteúdo do certificado

Como variáveis de ambiente são sempre interpretadas como strings, precisamos adicionar manualmente as quebras de linha no conteúdo do certificado usando `\n`:

Exemplo do conteúdo original:

```
-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUBgS0wppL1p6E4M3HJYqXw6JQ71YwDQYJKoZIhvcNAQEM
... (linhas omitidas) ...
UC9DWQ==
-----END CERTIFICATE-----
```

Agora, convertemos para:

```powershell
POSTGRES_CA="-----BEGIN CERTIFICATE-----\nMIIEUDCCArigAwIBAgIUBgS0wppL1p6E4...string-longa...==\n-----END CERTIFICATE-----\n";
```

> ⚠️ Atenção:
>
> - O valor precisa estar entre aspas duplas para que o `\n` seja interpretado corretamente.
> - Alguns serviços (como a própria Vercel) podem aceitar diretamente o conteúdo puro do certificado sem a necessidade de adicionar `\n`, pois tratam internamente.

#### 🔧 Como inserir rapidamente as quebras:

No editor de texto:

1. Selecione o fim de cada linha.
2. Use `Ctrl + D` para múltiplas seleções.
3. Substitua o fim da linha por `\n`.

![Quebra de linha](img/quebra-de-linha-cert.png)

---

## ✅ Testes realizados

### Ambiente Local

```js
// 20250602112404
// https://fuzzy-waffle-g6575wjxrj2vvqq-3000.app.github.dev/api/v1/status

{
  "updated_at": "2025-06-02T14:24:03.446Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 25,
      "opened_connections": 2
    }
  }
}
```

### Ambiente Produção (Vercel)

```js
// 20250602122534
// https://clone-tabnews.thiagokj.site/api/v1/status

{
  "updated_at": "2025-06-02T15:25:33.579Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 25,
      "opened_connections": 2
    }
  }
}
```

---

Agora temos uma conexão segura, funcionando tanto localmente quanto em produção, com uso do certificado digital de forma flexível.
