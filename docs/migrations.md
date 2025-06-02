# 🔄 Migrations

Sabe aquela vida de desenvolvimento antes do Git? Então... para banco de dados sempre foi um desafio controlar as versões.

Scripts ou alterações feitas em ambiente de desenvolvimento nem sempre eram replicados corretamente para produção — ou o contrário — gerando confusão, divergência de ambientes e muita dor de cabeça.

Para resolver esse problema, surgiram as **migrations**. Com elas, conseguimos ter um controle claro e versionado de tudo que foi alterado no banco de dados, de forma automatizada e segura.

Esse controle via código facilita a replicação dos ajustes em qualquer ambiente, garantindo consistência.

Normalmente, a responsabilidade das migrations se divide em duas partes:

- **Arquivos de Migração:** arquivos contendo, em ordem sequencial, as alterações no banco.
- **Framework de Migração:** ferramenta que garante a execução ordenada e única de cada migration.

## Escolhendo o Framework

Existem várias ferramentas para lidar com migrations. Uma das mais conhecidas é o [Sequelize](https://sequelize.org), que também atua como ORM e suporta diversos bancos de dados.

Porém, no nosso caso, vamos adotar uma solução mais simples, focada em Postgres: o `node-pg-migrate`.

### Configurando o node-pg-migrate

Primeiro, vamos instalar a dependência:

```powershell
npm install node-pg-migrate@6.2.2
```

Agora, vamos adicionar scripts no `package.json` para facilitar a criação e execução das migrations:

```js
// trecho package.json
"scripts": {
  ...,
  "migration:create": "node-pg-migrate create"
},
```

No terminal, podemos criar uma nova migration com:

```powershell
npm run migration:create primeiro teste com migration
# Exemplo de saída:
# Created migration -- /workspaces/clone-tabnews/migrations/1748885542945_primeiro-teste-com-migration.js
```

**Importante entender a diferença conceitual em relação ao Git:**

- O Git salva o estado completo dos arquivos.
- As migrations salvam o "diff", ou seja, cada alteração individualmente.
- As alterações são executadas em sequência.

Dentro da migration criada, teremos um arquivo base como este:

```js
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Comandos que aplicam as alterações (migrar "para cima")
};

exports.down = (pgm) => {
  // Comandos que desfazem as alterações (migrar "para baixo")
};
```

Assim, definimos algumas regras de ouro:

1. **Proibido alterar o banco manualmente.**
2. **Sempre crie um arquivo de migration.**
3. **Use o `up` para aplicar as alterações.**
4. **Use o `down` para desfazer as alterações.**

### Melhorando a organização dos scripts

Podemos organizar os diretórios para as migrations e deixar os comandos mais enxutos:

```js
// package.json com diretório infra/migrations
"scripts": {
  ...,
  "migration:create": "node-pg-migrate -m infra/migrations create",
  "migration:up": "node-pg-migrate -m infra/migrations up"
},
```

### Configurando o dotenv

O `node-pg-migrate` precisa da string de conexão do banco para rodar. Vamos usar o `dotenv` para carregar as variáveis de ambiente:

```powershell
npm install dotenv@16.4.4
```

Agora ajustamos o script e criamos o arquivo `.env.development`:

```js
// package.json
"scripts": {
  ...,
  "migration:up": "node-pg-migrate -m infra/migrations --envPath .env.development up"
},
```

```env
// .env.development
DATABASE_URL=postgres://local_user:local_password@localhost:5432/local_db
```

### Executando as migrations

Rodando o comando:

```powershell
npm run migration:up

# Exemplo de saída:
> node-pg-migrate -m infra/migrations --envPath .env.development up

> Migrating files:
> - 1748887181906_primeiro-teste-com-migration
### MIGRATION 1748887181906_primeiro-teste-com-migration (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748887181906_primeiro-teste-com-migration', NOW());

Migrations complete!
```

O `pg-migrate` mantém um registro das migrations já aplicadas. Se tentarmos rodar o mesmo comando novamente, ele não fará nada, pois detecta que já aplicou tudo.

Criando um novo teste:

```powershell
npm run migration:create segundo teste com migration
npm run migration:up

# Exemplo de saída:
> Migrating files:
> - 1748888162234_segundo-teste-com-migration
### MIGRATION 1748888162234_segundo-teste-com-migration (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1748888162234_segundo-teste-com-migration', NOW());

Migrations complete!
```

Como esperado, apenas a nova migration foi executada.

> ⚠️ Dica rápida: Para apagar todas as migrations de teste, podemos executar:
>
> ```powershell
> rm -rf infra/migrations
> ```
>
> - `rm`: comando de remoção.
> - `-rf`: opção para apagar recursivamente pastas e arquivos.
