# Testes de email

Para testar os emails, o ideal é começar limpando a caixa de email a cada teste. Como a documentação do `MailCatcher` não fornece um método específico para apagar as mensagens, vamos investigar um jeito.

Via interface web, há uma opção de clicar no botão "Clear". Investigando com o `DevTools`→ `Network`, ao utilizar o **clear**, é realizada uma chamada ao endpoint `/message `utilizando o verbo HTTP `DELETE`.”

## Chamando via aplicação

Então, é só fazer a chamada HTTP.

```bash
# Novas variáveis de ambiente.
EMAIL_HTTP_HOST=localhost
EMAIL_HTTP_PORT=1080
```

Criando um novo método no orchestrator.js

```js
async function deleteAllEmails() {
  await fetch(
    `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages`,
    {
      method: "DELETE",
    },
  );
}
```

E agora, é só utilizar esse método no início do teste, simples assim 😀.

```js
describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();
    // demais códigos...
  });
});
```

Recuperando o último email em json.

```js
async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  console.log(emailListBody);
}
```

Fechou! Para entregar um teste completo, seguimos a mesma lógica de comunicação com outros serviços da infra.

1. Antes de rodar os testes, aguardamos a inicialização dos serviços.
1. Dentro do teste, sempre é limpa a caixa de emails antes de realizar novos testes.
1. Capturamos o último email, validando se toda a estrutura foi preenchida.

```js
// tests/integration/infra/email.test.js
import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "FinTab <contato@fintab.com.br>",
      to: "contato@curso.dev",
      subject: "Teste de email",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "FinTab <contato@fintab.com.br>",
      to: "contato@curso.dev",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@fintab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email.\r\n");
  });
});
```
