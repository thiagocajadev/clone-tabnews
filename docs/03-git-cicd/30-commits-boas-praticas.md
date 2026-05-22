# ✍🏻 Commits

Commits são importantes para o controle de versão no código?

Sim, mas não precisam ser extremamente perfeitos.

Há softwares no mercado que apenas ignoram padrões. Em sua maioria são projetos de dev solo.

Agora quando olhamos para times e organizações, queremos ver o que há de melhor em controles e processos.

## Guia do Kernel Linux

Os commits do Kernel do Linux são extremamente rigorosos.

"Separe cada mudança lógica em um commit separado".

Código e Documentação são coisas separadas e ai está um bom exemplo pra começar.

Um commit para cada um é interessante.

Quando há alteração em um componente ou trecho de código para performance, temos um bom candidato para commit.

Assim como alterar esse mesmo componente para adicionar um novo recurso, deve ser feito em outro commit.

Performance, Feature, Correção... Cada ação deve ser tratada como um commit diferente.

"Cada commit deve ser justificável por seus próprios méritos".

O escopo de uma alteração precisa ter início, meio e fim.

No caso de uma alteração que altere diversos locais do sistema, gerando efeitos colaterais, o ideal é tratar isso como um commit com a conclusão total do processo.

> **Commit + Documentação:** Uma reversão no caso de bug, obriga a corrigir o código e reescrever a documentação.  
> **Commits separados:** Precisam de alinhamento na atividade, para garantir ao final do processo toda alteração no código está sincronizada com a documentação.

Sempre é bom pensar: e se eu precisar voltar? Tudo volta funcionando como antes?

Se eu precisar pesquisar nos logs e verificar a data e hora, quanto tempo de exposição devido ao bug.

Essas informações são essenciais para um acompanhamento e tomada de ações pela equipe.

## Tempo verbal

Bons programadores utilizam o imperativo em seus commits. O próprio GIT gera commits assim:

❌ Tempo verbal passado:

> "Ajustei o bug de cadastro"  
> "Adicionei um botão maior na interface"

✅ Tempo verbal imperativo presente:

> "Ajusta o bug de cadastro"  
> "Adiciona um botão maior na interface"

Antes de colocar a mensagem no commit, responda sempre pra você mesmo: **"O que esse commit faz?"**.

Os commits são como um diário. Quando você ler o histórico irá se perguntar o `que cada commit faz`, qual foi a `ordem para o código` e a resposta ficará mais clara.

> P: O que esse commit faz?  
> R: Ajusta o botão de cadastro.

## Commits em Inglês ou Português?

Isso pode variar muito de time pra time. A língua nativa sempre é mais fácil para comunicação.

Porém, em equipes ou projetos internacionais, normalmente é escolhido o inglês.

O alcance em um projeto em inglês é bem maior e facilita uma compreensão global.

Em processos seletivos também pode ser um diferencial para combinar com o estilo de código.

Uma boa prática é seguir [Conventional Commits](https://www.conventionalcommits.org), com sugestões efetivas.

## Conventional Commits

O padrão **Conventional Commits** define uma convenção simples e estruturada para mensagens de commit, facilitando a automação de versões (`semantic versioning`), geração de changelogs e processos de CI/CD. **Verbos sempre no imperativo presente**.

Obs: Em português, faz mais sentido interpretar o tempo como **presente do indicativo na terceira pessoa do singular**.

> Português o imperativo traz uma ideia de ordem a ser cumprida: adicione [você], corrija [você], ajuste [você].  
> Presente do indicativo na terceira pessoa do singular: [esse commit] adiciona, [esse commit] corrige, [esse commit] ajusta

O mais importante acima dessas regrinhas linguísticas é `comunicar com clareza`.

### Estrutura básica

```
<tipo>[escopo opcional]: <mensagem breve>

[descrição mais longa opcional]

[rodapé(s) opcional(is)]
```

### Tipos mais usados

- `feat`: adiciona uma nova funcionalidade ao código (gera **minor version**).
- `fix`: corrige um bug (gera **patch version**).
- `chore`: tarefas menores e sem impacto direto no código de produção (ex: configs, builds).
- `docs`: alterações na documentação.
- `style`: mudanças que não afetam a lógica (espaços, formatação, ponto e vírgula).
- `refactor`: reestruturação do código que não altera funcionalidade nem corrige bug.
- `test`: adição ou modificação de testes.
- `perf`: melhorias de performance.
- `build`: alterações que afetam o sistema de build ou dependências externas.
- `ci`: mudanças em configurações de integração contínua.

### Exemplo prático

```bash
feat(auth): adiciona suporte a autenticação JWT
feat(auth): add support for JWT authentication

fix(api): corrige erro 500 ao criar usuário
fix(api): fix 500 error when creating user

chore: remove dependência não utilizada
chore: remove unused dependency
```

### Extras úteis

- Prefixe com `!` se a mudança for **breaking**:

  ```bash
  feat!: remove suporte à API antiga
  feat!: drop support for legacy API
  ```

- Use `BREAKING CHANGE:` no rodapé para detalhar:

  ```bash
  BREAKING CHANGE: a rota /login foi removida
  BREAKING CHANGE: the /login endpoint has been removed
  ```
