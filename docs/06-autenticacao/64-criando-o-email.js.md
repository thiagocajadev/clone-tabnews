# Criando email.js

Para disparar os emails, usamos o módulo `Nodemailer`. Ele é uma abstração, que faz o que fizemos na última aula, que é basicamente o envio de email para o servidor de saída, `outbound`.

```bash
# Instala a versão exata
npm install -E nodemailer@7.0.5
```

Agora a estratégia de uso é similar ao uso do `node pg` dentro do `database.js`, onde abstraímos o **client** para uso na aplicação.

```js
// infra/email.js
// A estrutura inicial fica assim
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMPT_USER,
    pass: process.env.EMAIL_SMPT_PASS,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});

async function send(mailOptions) {
  await transporter.sendMail(mailOptions);
}

const email = {
  send,
};

export default email;
```

## Fazendo testes

Partindo pro TDD, vamos criar os testes de integração

```js
// tests/integration/infra/email.test.js
// Inicialmente seria assim
import email from "infra/email.js";

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "FinTab <contato@fintab.com.br>",
      to: "contato@curso.dev",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });
  });
});
```

E para testar:

```bash
# Da match somente no teste email
npm run test:watch -- email

# Saída na interface web do MailCather - Source
From: FinTab <contato@fintab.com.br>
To: contato@curso.dev
Subject: Teste de assunto
Message-ID: <6e9c0c49-b5d5-f50a-cb53-74fccf26d17b@fintab.com.br>
Content-Transfer-Encoding: 7bit
Date: Mon, 25 Aug 2025 14:40:03 +0000
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

Teste de corpo.
```
