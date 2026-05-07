# Melhorando log de e-mails

Bom, erros 500 sempre vão existir e devemos estar preparados para lidar com eles.

O que podemos analisar em primeiro momento é o console do navegador. Num segundo momento, olhando pra aba network e analisando a requisição que gerou o erro. E por fim, olhando os logs do servidor.

Analisando os logs temos erro sobre a porta 465. Esse erro é tipico de SMTP, ou seja, problemas com e-mail.

## Quem lida com e-mails?

Em nosso projeto, quem lida com isso é a ativação da conta.

```js
// Trecho de infra/email.js
// Não temos as váriveis de ambiente no ambiente de staging, por isso vem valores padrão como
// localhost, porta 465.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});
```

Então agora melhorando o retorno do log

```js
// Trecho de infra/email.js
async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível enviar e-mail",
      action: "Verifique se o serviço de e-mails está disponível",
      cause: error,
      context: mailOptions,
    });
  }
}

// E adicionamos uma nova propriedade context passando como valor as opções
// do e-mail, para facilitar a debug.
export class ServiceError extends Error {
  constructor({ cause, message, action, statusCode, context }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });
    this.name = "ServiceError";
    this.action = action || "Verifique se o serviço está disponível";
    this.statusCode = 503;
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}
```

Isso deve contribuir com a visibilidade do que está acontecendo, com mais metadados.
