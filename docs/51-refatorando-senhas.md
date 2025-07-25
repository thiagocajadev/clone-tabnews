# Refatorando senhas

Pra começar, é precisar refatorar o model user.js que guarda a senha como texto puro.

Legal, mas não vou começar pelo começo. Na verdade quero explorar uma "side quest", uma tarefa paralela trazer um bônus na jornada que é a **especulação de código**.

## Especulando códigos

**Especular código** não é uma técnica formal documentada como **TDD** ou **Clean Code**, mas é usada informalmente para descrever o processo de imaginar mentalmente o funcionamento do código antes ou durante a escrita, tentando prever como os blocos vão interagir, quais problemas podem surgir e quais seriam as consequências de certas escolhas.
Na prática, isso é o ato de “simular” mentalmente o fluxo da aplicação, como se estivesse depurando o código sem executá-lo.

### Como o modo de pensar dos programadores influencia?

O estilo mental e a forma de raciocinar de um desenvolvedor impactam diretamente no design do software:

1. Influência da experiência

- Programadores mais experientes conseguem “ver o código rodando” na mente, prevendo bugs ou gargalos.
- Já iniciantes podem especular menos, porque ainda não possuem repertório suficiente para prever o impacto de certas escolhas.

2. Programadores analíticos e defensivos

- Tendem a antecipar erros e edge cases.
- Costumam aplicar validações, escrever código resiliente e testar hipóteses.
- São bons em prever comportamentos inesperados antes mesmo de rodar o código.

3. Programadores criativos/experimentais

- Focam em prototipar rápido, testando ideias na prática em vez de prever tudo.
- Podem criar soluções inovadoras, mas correm risco de deixar código frágil se não revisarem.

4. Programadores pragmáticos

- Buscam um equilíbrio entre "pensar antes" e "testar rápido".
- Valorizam soluções simples e diretas, evitando overengineering.

✅ Vantagem da especulação de código

- Permite encontrar bugs antes mesmo da compilação/testes.
- Melhora a clareza da lógica, ajudando a escrever código limpo.
- Evita retrabalho, pois o fluxo já é “testado mentalmente” antes da escrita.

❌ Desvantagem se usada em excesso

- Pode virar paralisia por análise: pensar demais e codar de menos.
- Erros só ficam claros na prática, e o excesso de especulação pode atrasar entregas.

Resumindo: A especulação de código é como um “debug mental” que aproveita a forma de raciocinar do programador para antecipar problemas. O modo de pensar (mais lógico, criativo ou pragmático) molda tanto a qualidade quanto a velocidade do desenvolvimento.

## Como fazer a especulação

Um bom ponto de início é falar pra si o que deve acontecer a partir do ponto de criação ou mudança. Ex: Preciso criar uma variável para armazenar o resultado de a + b.

Pra refatorar o model user, preciso calcular o hash da senha, então:

```js
// vou precisar criar um método que calcule o hash
// esse método vai precisar receber a senha ou um objeto que contenha a senha
// pra poder cumprir seu propósito
await hashPasswordInObject(userInputValues);

// criei a estrutura do método/função para fazer o hash
// no objeto passado como parâmetro
async function hashPasswordInObject(userInputValues) {
  // dentro do método, vou precisar retornar outra operação
  // que deve ter sua lógica separada e organizada
  // no model de password
  const hashedPassword = await password.hash(userInputValues.password);

  // com base no retorno, atualizo minha senha em texto para uma senha em hash
  userInputValues.password = hashedPassword;
}
```

Essa é uma abordagem simples. Métodos que ficam alterando o estado de um objeto dessa maneira não são uma boa prática, gerando efeitos colaterais com comportamentos inesperados. Para a didática inicial, vamos seguir assim.

Aqui um fluxo padrão para referência:

1. Especulo o método com a operação.
1. Especulo o método que irá realizar passo a passo a operação.
1. Especulo a importação do model para o escopo onde estou trabalhando.
1. Crio o model pra separar e organizar a lógica.
1. Faço a implementação do método que irá retornar o resultado da operação.

## Criando model password.js

Vamos instalar o módulo `bcryptjs` para geração de hashes.

```bash
# instala a versão exata do bcryptjs
npm i -E bcryptjs@3.0.2
```

E no model:

```js
// models/password.js
import bcrypjs from "bcryptjs";

async function hash(password) {
  const rounds = 14; // nº de vezes que o código é embaralhado
  return await bcrypjs.hash(password, rounds);
}
```

Agora os testes retornam as senhas com hash:

```bash
-   "password": "senha123",
+   "password": "$2b$14$Ldxc7EJBh6NcUv5rI3T1YuXGSDOVuFsR18huJXqwTJ1.P6n6H2.t6",
```

## Refatorando testes

Para didática, vamos importar os models pro teste. Essa não é uma boa prática, o ideal seria usar o orchestrator pra isso. Mas por enquanto vamos nesse caminho.

```js
// tests/users/post.test.js
import user from "models/user.js";
import password from "models/password.js";

// trecho do teste unique and valid data
expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

// recupera o usuario em um objeto
const userInDatabase = await user.findOneUserByUsername("thiagocajadev");

// compara o hash da senha informada com o hash da senha salva no banco
const correctPasswordMatch = await password.compare(
  "senha123",
  userInDatabase.password,
);

// se forem iguais, passa
expect(correctPasswordMatch).toBe(true);
```

Uma pequena refatoração para agilizar os testes no model password:

```js
async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

// no ambiente de testes, não é necessário embaralhar tanto assim o hash
// se for produção, faz 14 vezes, se não, apenas 1 vez
function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}
```
