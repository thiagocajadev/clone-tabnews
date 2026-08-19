# O React parece uma Engine de Jogo

Pra quem não sabe, o React é uma biblioteca JavaScript que é utilizada para criar interfaces de usuário.

E ele começou muito bem, popularizando o **Virtual DOM** (Document Object Model). Ele cria um DOM virtual em paralelo ao DOM real do navegador, comparando apenas as diferenças e atualizando apenas o que mudou. Isso tornava a interface mais fluida e rápida.

## E qual o diferencial do React?

Hoje em dia, várias bibliotecas usam Virtual DOM, então isso não é mais um diferencial. O diferencial do React é que ele é uma **biblioteca reativa**. 

Listando as coisas que tornam o React único:

1. **composição usando componentes** - Ele te dá ferramentas para construir uma aplicação a partir de componentes menores.

2. **Ecossistema** - Existe uma infinidade de bibliotecas e ferramentas que complementam o React, como Redux, React Router, Material-UI, etc, alem de documentação e uma comunidade gigante.

3. **Mercado e Contratação** - É um mercado muito forte e com alta demanda por profissionais.

4. **Modelo JavaScript-first** - O React é uma biblioteca JavaScript, e não uma framework. Isso significa que ele não te impõe uma estrutura de projeto, um jeito de fazer as coisas, etc. Voce pode usar o React do jeito que quiser. O problema disso é que a lib começou a se perder devido a questão de ser "JavaScript-first" e não ter uma estrutura de projeto definida, então o pessoal começou a usar cada um de um jeito.

## O mais próximo possível do JS e HTML

O JSX (JavaScript XML) é uma extensão de sintaxe para JavaScript. Ele é usado para criar elementos React. Ele é muito parecido com HTML, mas ele é JavaScript. Isso significa que você pode usar todo o poder do JavaScript no seu JSX. Por exemplo, você pode usar variáveis, funções, operadores, etc. no seu JSX. Então você pode usar HTML, JavaScript e CSS, tudo dentro do mesmo local.

E isso é feito sem ter um DSL (Domain Specific Language), que é uma linguagem específica para um domínio específico. Por exemplo, o CSS é uma linguagem específica para o domínio de estilo. O HTML é uma linguagem específica para o domínio de estrutura. O JavaScript é uma linguagem específica para o domínio de lógica.

Comparando DSLs:

```js
// Um exemplo em Vue.js. Veja que a diretiva v-if é específica para o Vue.

<Dashboard v-if="isLoggedIn" />
<Login v-else />
```

```js
// Um exemplo em React. Veja que usamos apenas JS. Quase puro, pois retornamos componentes React.

if(isLoggedIn) {
    return <Dashboard />
} else {
    return <Login />
}
```

No exemplo do Vue.js, temos uma diretiva que diz para o Vue que ele deve renderizar o Dashboard se a variável isLoggedIn for verdadeira e o Login se for falsa. Isso é uma coisa específica do Vue. Já no React, nós usamos o JavaScript puro para fazer a mesma coisa. Isso é o que significa ser JavaScript-first.

## O que afeta o React

Então, por utilizar o JS, vamos as coisas que tornam o React "dificil" em alguns pontos:

### Closures

Closures são funções que lembram do ambiente em que foram criadas, mesmo depois de terem sido executadas. Isso é uma coisa muito poderosa, mas que pode ser confusa para quem está começando. Por exemplo:

```js
function makeCounter() {
  let count = 0;
  
  return function() {
    return count++;
  }
}

const counter = makeCounter();
console.log(counter()); // 0
console.log(counter()); // 1
console.log(counter()); // 2
```

E esse comportamente parece com um **game loop**, que é o coração de um jogo. Nos jogos, esse loop (laço) é responsavel por atualizar o estado do jogo, renderizar (atualizar) os gráficos e processar os eventos, como se jogador apertasse uma tecla ou clicasse com o mouse. Cada atualização e renderização do jogo é chamada de **frame**.

#### Ciclos de renderização

Aqui nos vamos ter 3 fases do ciclo:

**Trigger** -> **Render** -> **Commit**

**Trigger**: É o gatilho. É o que da a faísca pra iniciar o ciclo. Esse trigger pode ser:
* Uma mudança de estado
* Uma mudança de props
* Um evento do usuário
* Uma chamada de API
* Um timeout
* Um interval

**Render**: É a fase onde o React vai re-renderizar (atualizar) os componentes. Ele vai chamar as funções dos componentes e vai gerar o Virtual DOM.

**Commit**: É a fase onde o React vai salvar as mudanças no DOM real.

### Identidade por referência

Além das closures, outro conceito muito importante para entender o React é a **identidade por referência**.

Em JavaScript, valores primitivos (`string`, `number`, `boolean`, etc.) são comparados pelo **valor**.

```js
10 === 10;           // true
"React" === "React"; // true
```

Já objetos, arrays e funções são comparados pela **referência** (o endereço onde estão na memória), e não pelo conteúdo.

```js
const person1 = { name: "Thiago" };
const person2 = { name: "Thiago" };

console.log(person1 === person2); // false
```

Apesar de possuírem exatamente os mesmos dados, são dois objetos diferentes, criados em locais diferentes da memória.

Agora veja outro exemplo:

```js
const person1 = { name: "Thiago" };
const person2 = person1;

console.log(person1 === person2); // true
```

Nesse caso, ambas as variáveis apontam para o mesmo objeto.

#### Por que isso importa no React?

O React utiliza muito essa comparação por referência para decidir se algo mudou.

Imagine um componente que recebe um objeto como propriedade:

```jsx
<User user={{ name: "Thiago" }} />
```

A cada renderização, esse objeto é criado novamente. Mesmo contendo os mesmos dados, sua referência será diferente.

```text
Render 1
┌────────────────────┐
│ { name: "Thiago" } │
└────────────────────┘
          ▲

Render 2
┌────────────────────┐
│ { name: "Thiago" } │
└────────────────────┘

Referências diferentes
```

Para o React, isso significa que o valor mudou. Já quando reutilizamos a mesma referência:

```jsx
const user = { name: "Thiago" };

<User user={user} />
```

Todas as renderizações utilizam exatamente o mesmo objeto.

```text
Render 1 ─────┐
              │
Render 2 ─────┤──► Mesmo objeto
              │
Render 3 ─────┘
```

Agora o React consegue perceber que nada mudou.

#### Isso explica vários Hooks

Esse conceito aparece em praticamente todos os Hooks do React.

Por exemplo:

```jsx
useEffect(() => {
  console.log("Executou");
}, [user]);
```

O `useEffect` não verifica se o conteúdo do objeto mudou.

Ele verifica se **a referência mudou**.

Se um novo objeto for criado, mesmo com os mesmos valores, o efeito será executado novamente.

O mesmo acontece com:

- `React.memo`
- `useMemo`
- `useCallback`
- Dependências do `useEffect`
- Dependências do `useMemo`
- Dependências do `useCallback`

Todos eles utilizam comparação por referência para saber se precisam executar novamente.

#### Uma forma simples de lembrar

- **Primitivos** → comparados pelo **valor**.
- **Objetos, arrays e funções** → comparados pela **referência**.

É justamente por isso que, em React, criar objetos ou funções dentro do componente pode gerar renderizações, efeitos e recálculos desnecessários. Entender esse comportamento é um dos passos mais importantes para compreender quando utilizar ferramentas como `useMemo` e `useCallback`.