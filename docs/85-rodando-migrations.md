# Rodando Migrations

No momento, estamos trancados pra fora do sistema. O endpoint que cria migrations atualmente (POST /migrations) não tem a feature `crete:migration`

Geralmente criamos um usuário admin no inicio pra ele ter todos os privilégios e conseguir executar todas as ações no sistema.

E é normal ter ficado pra fora, pois o sistema foi sendo montado de forma organica:

1. Primeiro o usuario sem features
2. Depois a camada de autenticação
3. E agora vem a camada de autorização

## Executando script de migration

Primeiro, criando o script pra ver o que vai rodar.

```js
// Trecho de package.json
"migrations:up:dry": "node-pg-migrate -m infra/migrations --envPath .env.development --dry-run up",
```

Vamos testar no ambiente de staging, então acesse o Neon e procure por connect.

Altere o banco de dados pra `staging` e depois connection string para `parameters only`. Copie os dados e altere o .env.development

> Altere o arquivo e fique de olho, depois vamos fazer um restore nele, evitando rodar testes em staging ou pior PRODUÇÃO.

Agora executando

```bash
npm run migrations:up:dry

# Deve retornar algoo como:

# > Migrating files:
# > - 1753979309449_create-sessions
# > - 1758469653054_add-features-to-users
```

Show. Agora podemos rodar `npm run migrations:up`. Agora voltando o restore do .env.development

```bash
git restore .env.development
```

Se não voltar o .env.development, quase 100% de certeza que testes ou outros scripts vão pra onde não deveria, claro que vai pra PRODUÇÃO. Haha.

Alias, a melhor forma é evitar se conectar em outros ambientes. Arquivos .env.development só podem ser acessiveis a ambientes sem impacto.

## Máquina Bastião

Um Bastião ou Bastion Host é uma máquina que serve como ponto de entrada para uma rede. É uma máquina que fica exposta à internet e que é usada para acessar outras máquinas que estão dentro da rede. Essa maquina é o ponto central e seguro para acessar o ambiente de produção.

O conceito aqui é que devemos lidar com segurança por arquitetura e não disciplina. Disciplina é quebravel e não escala.

Temos sempre que pensar de forma defensiva e evitar erros por esquecimento ou falta de atenção.

## Testando e você vai ter um erro 500

Sim, vai dar problema e vamos tentar resolver essa questão na próxima sessão.
