# 🧠 Tornando o projeto mais semântico

Após criarmos o .env, dizemos que esse será o arquivo a ser usado no ambiente de produção.

Porém, estamos desenvolvendo localmente.

Para evitar criar vários arquivos .env e as coisas começarem a ficar confusas, o ideal é trabalhar com um único arquivo `.env.development`.

```powershell
# alterando o nome do arquivo diretamente via git mv (git move)
git mv .env .env.development
```

## ⚠️ Dados sensíveis expostos

Como controlamos a versão dos arquivos, dados de configuração estão presentes no Git e até foram enviados pro GitHub.

Isso pode ser tornar um problema grave de segurança, pois deixamos uma porta aberta para qualquer um mexer no sistema.

Identificando um caso desses, devem ser tomadas medidas de contenção:

1. Invalidar as credenciais, trocando senhas e chaves privadas imediatamente
1. Seguir as recomendações do [GitHub](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Criando o `jsconfig.json`

Para configurar o caminho base do projeto, podemos usar o `jsconfig.json`. Esse arquivo é direcionado ao uso com VS Code.
