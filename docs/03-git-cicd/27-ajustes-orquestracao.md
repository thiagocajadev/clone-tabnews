# Ajustando orquestração

"Primeiro você codifica, depois você refatora" 😄

## Max timeout

O `retry` do jeito que está no código vai ficando cada vez mais lento a medida aumenta o tempo para aguardar o servidor web.

```js
// trecho do script test - package.json
// quanto maior o tempo de resposta do servidor web, maior a lentidão no teste
'sleep 5; next dev'

// trecho orchestrator
async function waitForWebServer() {
  return retry(fetchStatusPage, {
    retries: 100, // tentativas de exec
  });

  // bail e tryNumber são parâmetros injetados automaticamente pelo pacote retry
  // bail é uma função pra abortar manualmente as tentativas
  // tryNumber é o número da tentativa atual
  async function fetchStatusPage(bail, tryNumber) {
    console.log(tryNumber);
    const response = await fetch("http://localhost:3000/api/v1/status");
    const responseBody = await response.json();
  }
}

// log
// quanto mais tentativas, mais o servidor web demorou até estar respondendo
[jest]  PASS  tests/integration/api/v1/migrations/post.test.js (11.853 s)
[jest]   ● Console
[jest]
[jest]     console.log
[jest]       1
[jest]
[jest]       at log (tests/orchestrator.js:12:15)
[jest]
[jest]     console.log
[jest]       2
[jest]
[jest]       at log (tests/orchestrator.js:12:15)
...
[jest] Time:        12.212 s, estimated 13 s
```

Para mensurar o tempo de execução, buscando melhorar a performance, podemos adicionar a instrução time antes de executar o npm, assim `time npm test`.

```powershell
# parte final do log do time npm test
real    0m4.411s
user    0m2.284s
sys     0m0.417s
```

Agora temos o tempo total do inicio ao fim para execução do comando. O legal é rodar algumas vezes para pegar a média do tempo `real`. Nesse exemplo, minha média foi `4,2 segundos` em 5 teste seguidos.

```powershell
# medindo de forma real
npm run services:down && time npm test

# tempos
0m24.451s
0m17.041s
0m26.232s
0m17.339s
0m24.252s
média: 21,8s
```

Aplicando o maxTimeout, não é preciso aguardar o fator 2 do jest, que fica aguardando cada vez mais entre uma tentativa e outra.

```js
// trecho do orchestrator
return retry(fetchStatusPage, {
  retries: 100,
  maxTimeout: 5000, // 5 segundos limite para próxima tentativa
}

// log com timeout
0m19.927s
0m18.993s
0m17.271s
0m20.339s
0m19.001s
média: 19,1s
```

Removendo instrução do test `wait-for-postgres`, carregando o servidor web e banco em paralelo.

0m16.177s
0m13.553s
0m13.947s
0m13.682s
0m13.955s
média: 14,2

Baixando o `maxTimeout` para 1 segundo.

0m13.431s
0m13.231s
0m13.042s
0m13.158s
0m13.355s
média: 13,2

Último teste, removendo `sleep 10`, deixando o servidor web iniciar sem atraso.

0m6.602s
0m6.378s
0m6.307s
0m5.888s
0m6.532s
média: 6,3

Comparativo com as métricas:

| Tempo padrão | TimeOut 5s  | Sem wait-postgres | TimeOut 1s  | Sem sleep 10 | Redução tempo | Redução %     |
| ------------ | ----------- | ----------------- | ----------- | ------------ | ------------- | ------------- |
| 0m24.451s    | 0m19.927s   | 0m16.177s         | 0m13.431s   | 0m6.602s     | ------------- | ------------- |
| 0m17.041s    | 0m18.993s   | 0m13.553s         | 0m13.231s   | 0m6.378s     | ------------- | ------------- |
| 0m26.232s    | 0m17.271s   | 0m13.947s         | 0m13.042s   | 0m6.307s     | ------------- | ------------- |
| 0m17.339s    | 0m20.339s   | 0m13.682s         | 0m13.158s   | 0m5.888s     | ------------- | ------------- |
| 0m24.252s    | 0m19.001s   | 0m13.955s         | 0m13.355s   | 0m6.532s     | ------------- | ------------- |
| ------------ | ----------- | ----------------- | ----------- | ------------ | ------------  | ------------- |
| Média        | Média       | Média             | Média       | Média        | Redução Média | Redução Média |
| 21,2s        | 19,1s       | 14,2s             | 13,2s       | 6,3s         | -14,9s        | 30%           |

> 💡 Não há nada mais profissional do que provar um ganho de 30% de performance, mostrando isso com dados de forma transparente

## Escapando delimitadores de comando

Cada sistema operacional interpreta comandos de forma diferente.

No nosso script de testes no `package.json`, usamos comandos entre aspas simples:

```js
// trecho do script
"test": "npm run services:up && concurrently --names next,jest --hide next -k -s command-jest 'next dev' 'jest --runInBand' --verbose",
```

O problema é que no **Windows**, o terminal padrão (`cmd.exe`) **não reconhece aspas simples como delimitadores de string**. Isso faz o comando quebrar na hora de executar.

A solução é usar **aspas duplas**, que funcionam corretamente no Windows:

```js
"test": "npm run services:up && concurrently --names next,jest --hide next -k -s command-jest "next dev" "jest --runInBand" --verbose",
```

Porém, como o `package.json` é um arquivo em formato **JSON**, precisamos **escapar as aspas duplas** usando uma barra invertida (`\`). Sem isso, o JSON fica inválido.

```js
"test": "npm run services:up && concurrently --names next,jest --hide next -k -s command-jest \"next dev\" \"jest --runInBand\" --verbose",
```

Resumo:

- Use **aspas duplas** para garantir compatibilidade com Windows.
- Use **barra invertida (`\`)** para escapar as aspas duplas dentro do JSON.

Com isso, o comando final funciona em todos os sistemas operacionais.

## Tratando retorno do endpoint \status

Analisando o `fetchStatusPage`, ele não possui nenhum tratamento de erros.

```js
// trecho do orchestrator
async function fetchStatusPage() {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await response.json();
}
```

Vamos forçar algumas situações:

```powershell
# alterando a porta da url para 3001
# isso gera um erro de rede 500
http://localhost:3001/api/v1/status

# log parcial com npm test
# aqui temos erro de timeout, pois o servidor está disponível,
# porém a porta correta é a 3000 e o requisição foi feita na 3001
...
[+] Running 2/2
 ✔ Network infra_default   Created                                                                       0.1s
 ✔ Container postgres-dev  Started                                                                       0.3s
[jest]  FAIL  tests/integration/api/v1/migrations/post.test.js (60.598 s)
[jest]   ● POST to /api/v1/migrations should return 200
[jest]
[jest]     thrown: "Exceeded timeout of 60000 ms for a hook.
[jest]     Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."
[jest]
[jest]       2 | import orchestrator from "tests/orchestrator.js";
[jest]       3 |
[jest]     > 4 | beforeAll(async () =>...)

# informando o nome errado no endpoint status com mais um `s`
http://localhost:3000/api/v1/statuss

# log
# ocorre mais um erro de rede aqui, semelhante ao problema com a porta
[jest]  FAIL  tests/integration/api/v1/migrations/post.test.js (60.643 s)
[jest]   ● POST to /api/v1/migrations should return 200
[jest]
[jest]     thrown: "Exceeded timeout of 60000 ms for a hook.
```

O problema maior aqui é o comportamento do orquestrador. Como ele possui um `await response.json()`, está voltando uma resposta convertida em JSON, soltando a bateria de testes pra ser executada e isso não pode acontecer.

```js
// removido o responseBody
async function fetchStatusPage() {
  const response = await fetch("http://localhost:3000/api/v1/statuss");
}

// log. Os testes passaram!!! e na verdade não deveriam!!!
 ✔ Network infra_default   Created                                                                       0.1s
 ✔ Container postgres-dev  Started                                                                       0.3s
[jest]  PASS  tests/integration/api/v1/migrations/post.test.js
[jest]  PASS  tests/integration/api/v1/migrations/get.test.js
...
```

Os testes passam pois o cliente se conectou ao servidor na porta correta, porém o retorno do servidor 404 (não encontrado) não foi tratado, sendo apenas uma mensagem.

Agora voltando o metodo para a versão original e simulando o envio de erro via json, mesmo com o endpoint com endereço correto

```js
// trecho do orchestrator
async function fetchStatusPage() {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const responseBody = await response.json();
}

// trecho do endpoint /status
// simulando o acesso a uma pagina html
async function status(request, response) {
  return response.status(500).html("Erro 500");
}

// será lançada exceção de timeout novamente

// simulando o retorno em json do erro
async function status(request, response) {
  return response.status(500).json({ erro: "Error 500" });
}

// log
[jest]  FAIL  tests/integration/api/v1/status/get.test.js
[jest]   ● GET to /api/v1/status should return 200
[jest]
[jest]     expect(received).toBe(expected) // Object.is equality
[jest]
[jest]     Expected: 200
[jest]     Received: 500
```

Então pra resolver forçando o lançamento de erro:

```js
if (response.status !== 200) {
  throw Error();
}

// log
[jest]  FAIL  tests/integration/api/v1/status/get.test.js (5.678 s)
[jest]   ● GET to /api/v1/status should return 200
[jest]
[jest]     thrown: "Exceeded timeout of 5000 ms for a hook.
```
