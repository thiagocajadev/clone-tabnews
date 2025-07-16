# Padronizando Controllers

Padronizar as coisas garante que elas tenham o **mesmo comportamento**.

No estado atual, os endpoints permitem quaisquer tipos de requisições contra eles como GET, POST, PUT, etc. Vamos resolver isso começando pelo uso do `next-connect`.

```bash
# instala a versão exata sem fazer upgrade de pacotes
npm i -E next-connect@1.0.0
```

> Caso esteja usando Codespaces e precise recriar o container do espaço de trabalho, faça um commit.
> Agora pesquise no VS Code a opção Rebuild Container
