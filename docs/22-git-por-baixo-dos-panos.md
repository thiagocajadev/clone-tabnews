# 🔍 Git - Por baixo dos panos

Legal, temos 2 branches no projeto, porém ainda não foi realizado o `merge` (mescla, união, junção).

Então imagine esquecer ou executar um comando por engano antes de mandar as alterações pra produção, e perder dias ou semanas de trabalhos... 😢

A boa notícia é que temos formas de reverter esse cenário caótico com comandos no git.

```powershell
# exibe todas as branches do projeto
git branch

# no momento, 3 branches disponíveis e o asterisco indicando a que está em uso
@thiagokj ➜ /workspaces/clone-tabnews/docs (main) $ git branch
  fix-migrations-endpoint
* main
  tamanho-do-cabelo
```

Antes de apagar uma branch, é interessante fazer um checkout pra ela e analisar o git log para ver últimos commits.
