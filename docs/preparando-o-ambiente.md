# 📚 Preparando o ambiente

Aqui vamos preparar a stack de desenvolvimento, empilhando as aplicações sobre o Node, sendo assim:

- Node.js 18.20.8 LTS Hydrogen 
- Next.js 13.1.6
- React.js 18.2.0
- React-dom 18.2.0


1. Aplique os comandos no terminal para configurar as versões do framework e demais dependências:

    ```powershell
    # Checa versão atual do Node no Codespaces.
    node -v

    # Verifica as versões disponíveis pra instalação com o gerenciador de pacotes do Node, o NVM.
    nvm ls

    # Instala versão com suporte estendido (LTS).
    nvm install lts/hydrogen

    # Configura para sempre iniciar com a versão LTS.
    nvm alias default lts/hydrogen
    ```

2. Crie o arquivo .nvmrc:

    O RC no final significa Run Commands. É uma convenção para execução de scripts e instruções de inicialização.

    ```powershell
    # Adicione a instrução para usar a versão instalada.
    lts/hydrogen
    ```

    Agora ao executar **nvm install**, será direcionado a essa versão.

3. Instale o Next.js

    ```powershell
    # Use o gerenciador de pacotes do Node para configurar e preparar a instalação do Next.js. Será criado o arquivo package.json com as configurações.
    npm init

    # Instale o Next.js. Todas as dependências do projeto serão incluídas no package.json.
    npm install next@13.1.6
    ```

4. Instale o React.js
    ```powershell
    # O react será o frontend, vamos criar as telas da aplicação nele.
    # Instalamos primeiro o Core.
    npm install react@18.2.0

    # Agora instalamos o módulo específico para Html.
    npm install react-dom@18.2.0
    ```

5. Configure o servidor web para rodar a aplicação.
    Altere o package.json para execução, ele ficará igual o abaixo:

    ```js
    {
        "name": "clone-tabnews",
        "version": "1.0.0",
        "description": "projeto do curso.dev",
        "main": "index.js",
        "scripts": {
            "dev": "next dev"
        },
        "author": "",
        "license": "MIT",
        "dependencies": {
            "next": "^13.1.6",
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        }
    }
    ```
    Para executar no terminal use **npm run dev**.

## 📄 Criando Páginas

1. Crie na pasta **pages** no projeto. Essa pasta será lida pelo Next para encontrar as paginas.

2. Crie um arquivo dentro da pasta chamado **index.js**. Essa será a rota para Home.
    ```js
    // Dentro das paginas criamos funções para renderizar os conteúdos e exportamos a função padrão.
    function Home(){
        return <h1>Teste</h1>
    }

    export default Home;
    ```

3. Torne a rota publica para acesso externo.
    No terminal, clique na aba Portas, botão direito em Visibilidade -> Visibilidade da porta -> Public.

## 💾 Salvando o projeto no GitHub

1. Crie um arquivo chamado .gitignore. Aqui vamos informar arquivos e pastas para não ficarem no controle de versão.

2. No terminal, use sempre comandos do git, com a palavra git + comando especifico (git status, git add, etc).

2. Use o **git status** para avaliar as alterações feitas no projeto.

3. Use o **git add .gitignore** para adicionar o arquivo ao rastreamento do git. 

4. Caso haja alterações em qualquer arquivo, basta executar novamente o git add.

5. Use o **git push** pra empurrar o trabalho local pro GitHub.

6. Use o **git add** para adicionar as demais dependências.

7. Use o **git commit --amend --no-edit** caso tenha esquecido algum arquivo, mantendo a mensagem anterior e adicionando apenas as alterações que faltaram.

8. Caso use o **git log**, vc irá paginar o log com alterações. Pressione **q** pra sair e voltar ao terminal.

### 🧠 Comandos Git Essenciais

```powershell
touch .gitignore                                # Cria o arquivo .gitignore
git add .gitignore                              # Adiciona o .gitignore ao rastreamento
git status                                      # Mostra o status atual do repositório
git add nome-do-arquivo                         # Adiciona um arquivo específico
git add -A                                      # Adiciona todas as alterações e exclusões
git commit -m "Mensagem"                        # Cria um commit com mensagem
git commit -m 'adiciona arquivo `.minhaConfig`' # Destaca o arquivo no commit
git commit --amend --no-edit                    # Emenda o último commit sem alterar a mensagem
git push                                        # Envia as alterações ao GitHub
git push --force                                # Envia as alterações ao GitHub, forçando em caso de divergência
git pull                                        # Baixa e aplica as alterações do GitHub
git rm nome-do-arquivo                          # Remove o arquivo do Git e do disco
git rm --cached nome-do-arquivo                 # Remove o arquivo do Git, mas mantém no disco
git log                                         # Exibe o histórico de commits (pressione 'q' para sair)
```