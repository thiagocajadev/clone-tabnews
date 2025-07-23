# Ajustes e refatorações migrations User

Primeiro, já mandando aquele rebase interativo

```bash
# passando o commit que se quer alterar, porem adicionando ao final
# um acento circunflexo ^, informando que o commit base sera 1 anterior
git rebase -i 62d1fb41325a58efb6a40936cd44db09689bfc72^
```

A vantagem disso é poder voltar no tempo e fazer ajustes, apenas por questão de organização no histórico de alterações. Em outros ambientes, apenas um commit pra frente também resolve qualquer questão de realização de ajustes.

No arquivo aberto do **rebase todo**, basta alterar **pick** para **edit** e fechar o arquivo, movendo o ponteiro do commit e permitindo a edição.

para checar se esse é o commit correto, só rodar um **git log** e ver onde aponta o HEAD.

```bash
commit 62d1fb41325a58efb6a40936cd44db09689bfc72 (HEAD)
Author: Thiago Cajaiba <thiago.cajaiba@gmail.com>
Date:   Mon Jul 21 10:57:39 2025 -0300

  feat: add migration to create `users` table
```

## Alterando a migration create users

Alguns pontos de ajuste aqui:

- Datas não nulas
- Datas com **now()** em **UTC**
- Tamanho da coluna **password**

```js
// infra/migrations/1753029002617_create-users.js
exports.up = (pgm) => {
  pgm.createTable("users", {
    // outros códigos acima..

    // ajuste para uso do bcrypt
    // For reference, https://www.npmjs.com/package/bcrypt#hash-info
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    // garante valores não nulos nos campos de data e hora
    // garante que os valores salvos estão em UTC
    // For reference, https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
```

Finalizado o ajuste, rodar:

```bash
# mescla o commit com as alterações
git commit --amend pra mesclar

# junta e reorganiza os commits
git rebase --continue
```
