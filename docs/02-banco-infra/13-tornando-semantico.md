# 🧠 Tornando o projeto mais semântico

Depois de criarmos o `.env`, definimos que ele seria o arquivo utilizado no ambiente de produção.

Porém, durante o desenvolvimento local, é melhor adotar uma abordagem mais organizada para evitar confusões com múltiplos arquivos `.env`. A prática recomendada é trabalhar com um único arquivo específico para desenvolvimento: o `.env.development`.

```powershell
# Renomeando o arquivo diretamente com o git para manter o controle de histórico
git mv .env .env.development
```

## ⚠️ Dados sensíveis expostos

Como estamos versionando os arquivos, dados de configuração podem acabar sendo incluídos no Git e enviados ao GitHub.

Isso representa um risco sério de segurança, já que informações como chaves de API, tokens e senhas podem ser acessadas por terceiros, comprometendo o sistema.

Caso isso aconteça, é importante agir rapidamente:

1. **Invalidar imediatamente as credenciais expostas**, atualizando senhas, tokens e chaves privadas.
2. **Seguir as orientações oficiais do GitHub** para remoção de dados sensíveis do repositório: [Documentação GitHub](https://docs.github.com/pt/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Utilizando o Absolute Imports

Para facilitar a importação de módulos no projeto, podemos configurar o caminho base com o `jsconfig.json`.

Esse arquivo, voltado principalmente para uso no VS Code, simplifica os imports, evitando caminhos longos e cheios de `../` para navegar entre pastas.

```js
// jsconfig.json
{
  "compilerOptions": {
    "baseUrl": "." // O ponto representa o diretório atual. Como o arquivo está na raiz do projeto, a referência sempre partirá da raiz.
  }
}
```

**Exemplo prático:**

Sem Absolute Imports (caminho relativo):

```javascript
import database from "../../../infra/database.js";
```

Com Absolute Imports (mais simples e direto):

```javascript
import database from "infra/database.js";
```

> 💡 **Dica extra:**
>
> - `.` representa o diretório atual;
> - `..` indica o diretório pai.

## 📜 Melhorando scripts

Hora de alterar os scripts para facilitar subir ou parar o ambiente.

> Dica: use o fuzzy search para navegar entre os arquivos, com `Ctrl + p`.
>
> - Nesse tipo de pesquisa, vc pode usar apenas iniciais + arroba + iniciais do trecho pra rapidamente alcançar o local da alteração.
> - Ex: `pk@sc` - Acessa o `package.json`, diretamente na propriedade `scripts`.

Subindo e baixando serviços:

```js
"scripts": {
    "dev": "next dev",
    "services:up": "docker compose -f infra/compose.yaml up -d",
    "services:down": "docker compose -f infra/compose.yaml down",
    "lint:check": "prettier --check .",
    "lint:fix": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watchAll"
  },
```

Dessa forma, só executar terminal esse comando reduzido `npm run services:up`, que ele sobe o docker.

Melhorando e integrando comandos:

```js
"scripts": {
    "dev": "npm run services:up && next dev",
    //... demais configurações
}
```

Agora pra subir do docker e o serviço web, só executar `npm run dev`.
