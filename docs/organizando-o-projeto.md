# ☑️ Organização

Tudo o que fazemos na vida, pode ser feito de uma forma mais efetiva.

Planejamento sobre as tarefas, nos da clareza e organização.

Pra valer a pena algo, pra ter aquela motivação pra realizar algo, o cérebro sempre faz o calculo do SALDO.

Esse SALDO vai nos dizer pra fazer ou não qualquer coisa. Por isso, devemos sair dessa armadilha mental.

Organizar é necessário. Quebrar um projeto em tarefas, passando do MACRO para o MICRO, tornando cada pequeno progresso algo viável e massa de se atingir.

Vamos aplicar isso no GitHub, usando os Milestones e Issues.

## 🪨 Milestones e Issues

**Milestone** - Tarefa Macro representando uma grande entrega.
**Issue** - Tarefa micro representando uma parte de uma grande entrega, atendendo uma necessidade especifica, resolvendo um problema e cenários menores.

A melhor prática é criar uma tarefa inicial ZERO, ou Milestone 0: Em construção.

Acesse o repositório do projeto no GitHub, e acesse Issues -> Milestones.

Não da pra acertar tudo ao criar um novo projeto, mas aqui é possível ir trabalhando as ideias que serão revisadas conforme evolução.

Temos que buscar a dopamina aqui. Sim, somos guiados pela dopamina pra jogos, sair com amigos, ir pra festas, igreja, bares, etc.

E aqui não é diferente. Se tiver coisas positivas acontecendo, teremos o estimulo pra realizar.

Siga o fluxo : Início, Progresso e Conclusão. Abaixo exemplo da organização proposta:

![Milestones e Issues](img/milestones-e-issues.png)

Obs: **CTN-XXX** significa **C**lone **T**ab **N**ews - Numero sequencial da tarefa.

É isso!

## 👨🏻‍💻 Code Styles

A melhor forma de trabalhar sozinho ou equipe é seguir as regras de padronização do estilo de código.

Pular ou não linhas, aspas simples, palavras chaves pulando linhas e usando tabs ou espaços, letras maiúsculas, camelCase, snake_case, PascalCase...

Isso facilita a manutenção e integração da equipe.

Para criar sub-tarefas dentro da issue, use traços e colchetes assim:

```powershell
# - [ ] tarefa1
# - [ ] tarefa2
```

- [ ] tarefa1
- [ ] tarefa2

![Sub-tarefas](img/sub-tarefas.png)

Assim fica muito fácil de atualizar os status!

Habilite a sincronização do editor no GitHub com sua conta do VSCode.

### 📝 Padronizando com EditorConfig

Crie um arquivo na raiz do projeto chamado **.editorconfig**. Adicione as seguintes linhas

```bash
root = true // Delimita a aplicação da configuração ao diretório.

[*] // Aplica em todas as linguagens. Pode ser delimitado com [*.{js,cs}]. No caso Csharp e javascript

indent_style = space
indent_size = 2
```

Instale a extensão do [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig).

### 📝 Configurando o Prettier

O Prettier vai deixar a formatação mais bonita, confia!

1. Instale ele via NPM, facilitando a configuração padrão para todos os DEVs do time.

```powershell
# Instala o Prettier com dependencia apenas para Desenvolvimento. Pode ser usado --save-dev ou -D
npm install prettier --save-dev
```

2. No manifesto será criado registro da dependência.

```js
"devDependencies": {
  "prettier": "^3.5.3"
}
```

3. Crie um novo script pra executar a verificação de formatação (lint) e outro pra executar as alterações, no manifesto package.json

```js
"scripts": {
  "dev": "next dev",
  "lint:check": "prettier --check .",
  "lint:fix": "prettier --write ."
}
// Obs: o pontinho após o --check e --write informa pra executar em todos os arquivos e diretórios desse nível pra frente.
```

4. Execute no terminal **npm run lint:check**. Caso queria aplicar as formatações recomendadas use **npm run lint:fix**.

5. Finalizando, baixe a extensão do Prettier no editor e configure:

- Acesse Menu -> Configurações. Digite **formatter**. Troque o padrão para **Prettier**.
- Agora procure por **format on save** e marque a opção.
- Por fim, desmarque a opção **auto save**. Será útil para execução com testes automatizados.
