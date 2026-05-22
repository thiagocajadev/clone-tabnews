# ♾️ Hora do Merge

O `merge` é a mescla, junção dos códigos entre uma branch com outra.

Para realizar esse processo, existem 2 caminhos:

`Fast Forward` e `3 way`.

## Fast Forward

Como fazer a branch `main` ter os commits da branch `fix-migrations-endpoint`?

```powershell
# muda para branch main, que irá receber os commits
git checkout main

# informa de qual branch irá vir os commits
git merge fix-migrations-endpoint

# log console
@thiagokj ➜ /workspaces/clone-tabnews (main) $ git merge fix-migrations-endpoint
Auto-merging README.md
Merge made by the 'ort' strategy.
 pages/api/v1/migrations/index.js | 64 +++++++++++++++++++++++++++++++++++-----------------------------
 1 file changed, 35 insertions(+), 29 deletions(-)
```

> O merge não foi fast-forward porque a branch main tinha commits diferentes da fix-migrations-endpoint.
> O Git precisou fazer um merge real com estratégia (ort) para unir os históricos.

Resumindo:

O merge fast-forward só acontece quando a branch de destino (ex: main) não avançou desde que a outra branch (ex: feature) foi criada.

Ou seja, a branch (feature) tem commits à frente da main, mas a main está no mesmo ponto onde a branch foi criada.

Vamos simular criando uma branch feature:

```powershell
# Cria nova branch a partir da main
@thiagokj ➜ /workspaces/clone-tabnews (main) $ git checkout -b feature
Switched to a new branch 'feature'

# Cria um arquivo de teste
@thiagokj ➜ /workspaces/clone-tabnews (feature) $ code arquivo.txt
@thiagokj ➜ /workspaces/clone-tabnews (feature) $ git add arquivo.txt
@thiagokj ➜ /workspaces/clone-tabnews (feature) $ git commit -m 'adicionado txt para teste'
[feature c6ed766] adicionado txt para teste
 Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
 1 file changed, 1 insertion(+)
 create mode 100644 arquivo.txt

# Volta para main
@thiagokj ➜ /workspaces/clone-tabnews (feature) $ git checkout main
Switched to branch 'main'
Your branch is ahead of 'origin/main' by 5 commits.
  (use "git push" to publish your local commits)

# Git merge executa o fast-forward
@thiagokj ➜ /workspaces/clone-tabnews (main) $ git merge feature
Updating 85e8d29..c6ed766
Fast-forward
 arquivo.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 arquivo.txt
```

Agora sim, como a nova branch recebeu um commit, ela ficou à frente da main, que não teve nenhum commit até aquele momento.

Ao fazer o merge, o Git apenas avançou o ponteiro da main — isso é um fast-forward.

```powershell
@thiagokj ➜ /workspaces/clone-tabnews (main) $ git log
commit c6ed766092c80dfcea86916283e9c6df96d5897e (HEAD -> main, feature)
Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
Date:   Thu Jun 12 18:14:49 2025 +0000

    adicionado txt para teste
```

Usando o `git log --graph` para enxergar a mudança na linha do tempo

```powershell
* commit c6ed766092c80dfcea86916283e9c6df96d5897e (HEAD -> main, feature)
| Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| Date:   Thu Jun 12 18:14:49 2025 +0000
|
|     adicionado txt para teste
|
*   commit 85e8d292f55ec8bc89e379cc6d6be4444d71b4d8
|\  Merge: 0023948 f755bd6
| | Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| | Date:   Thu Jun 12 18:08:46 2025 +0000
| |
| |     Merge branch 'fix-migrations-endpoint'
| |
| * commit f755bd6fa90d56f7930021f8043e6487f22d078e (fix-migrations-endpoint)
| | Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| | Date:   Thu Jun 12 18:07:46 2025 +0000
| |
| |     exemplo teste forward
| |
* | commit 002394805c73eaffccf9b9c3587b677a5d2e347b
|\| Merge: 3c9bf4d e606936
| | Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| | Date:   Thu Jun 12 17:57:48 2025 +0000
| |
| |     Merge branch 'fix-migrations-endpoint'
| |
| * commit e606936ed145488cd484876d6c2ee0acefd8be6f (origin/fix-migrations-endpoint)
| | Author: Thiago Cajaíba <51033018+thiagokj@users.noreply.github.com>
| | Date:   Tue Jun 10 17:22:37 2025 +0000
| |
| |     fix `/migration` endpoint connection bug
| |
```

Em outra etapa, vamos usar a abordagem `3 way`.

# Usando cURL com jq

Esse comando abreviado permite disparar contra um endpoint de forma contínua.

```powershell
# retornando json formatado
# -s é o modo silencioso, ocultando progresso e erros
# jq é o formatador. A comunidade se refere como json query
curl -s https://clone-tabnews.thiagokj.site/api/v1/status | jq

@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s https://clone-tabnews.thiagokj.site/api/v1/status | jq
{
  "updated_at": "2025-06-13T16:54:03.222Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 901,
      "opened_connections": 1
    }
  }
}

# adicionando um watch para ficar observando continuamente o endpoint
watch 'curl -s https://clone-tabnews.thiagokj.site/api/v1/status | jq'

Every 2.0s: curl -s https://clone-tabnews.thiagokj.site/ap...  codespaces-a0e657: Fri Jun 13 17:01:27 2025

{
  "updated_at": "2025-06-13T17:01:27.950Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 901,
      "opened_connections": 1
    }
  }
}

# por padrão, ele executa a cada 2 segundos contra o endpoint
# para especificar um tempo menor
watch -n 1 'curl -s https://clone-tabnews.thiagokj.site/api/v1/status | jq'
Every 1.0s: curl -s https://clone-tabnews.thiagokj.site/ap...  codespaces-a0e657: Fri Jun 13 17:03:13 2025

{
  "updated_at": "2025-06-13T17:03:13.756Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 901,
      "opened_connections": 1
    }
  }
}
```

> Fica ali o detalhe para o relógio do terminal em sincronia com o json

É muita vantagem criar sistemas API First, pois há uma vasta flexibilidade para clients se conectarem e usarem ferramentas combinadas.

```powershell
# fazendo testes com migration em produção. GET implícito
curl -s https://clone-tabnews.thiagokj.site/api/v1/migrations | jq
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s https://clone-tabnews.thiagokj.site/api/v1/migrations | jq
[
  {
    "path": "infra/migrations/1748980342283_test-migrations.js",
    "name": "1748980342283_test-migrations",
    "timestamp": 1748980342283
  }
]

# GET
curl -s -X GET https://clone-tabnews.thiagokj.site/api/v1/migrations | jq
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s -X GET https://clone-tabnews.thiagokj.site/api/v1/migrations | jq
[
  {
    "path": "infra/migrations/1748980342283_test-migrations.js",
    "name": "1748980342283_test-migrations",
    "timestamp": 1748980342283
  }
]

# POST
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s -X POST https://clone-tabnews.thiagokj.site/api/v1/
migrations | jq
[
  {
    "path": "infra/migrations/1748980342283_test-migrations.js",
    "name": "1748980342283_test-migrations",
    "timestamp": 1748980342283
  }
]
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s -X POST https://clone-tabnews.thiagokj.site/api/v1/migrations | jq
[]

# testando chamadas PUT e DELETE, que não existem nesse endpoint
# aqui recebemos a mensagem de erro tratada
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s -X DELETE https://clone-tabnews.thiagokj.site/api/v
1/migrations | jq
{
  "error": "Method \"DELETE\" not allowed"
}
@thiagokj ➜ /workspaces/clone-tabnews (main) $ curl -s -X PUT https://clone-tabnews.thiagokj.site/api/v1/m
igrations | jq
{
  "error": "Method \"PUT\" not allowed"
}

# e só por curiosidade e validação, não ficou nenhuma conexão presa
# sim... o watch ficou rodando todo esse tempo no status hehe.
Every 1.0s: curl -s https://clone-tabnews.thiagokj.site/ap...  codespaces-a0e657: Fri Jun 13 17:25:59 2025

{
  "updated_at": "2025-06-13T17:25:59.904Z",
  "dependencies": {
    "database": {
      "version": "16.9",
      "max_connections": 901,
      "opened_connections": 1
    }
  }
}
```
