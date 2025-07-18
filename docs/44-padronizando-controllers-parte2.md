# Padronizando Controllers

Agora vamos pro nível 2 de abstração, removendo a duplicidade de código.

> Como ainda não usamos MVC, o código é apenas para estudo didático.

## Centralizando a lógica dos Controllers

Toda infraestrutura deve ser movida para um novo arquivo.

```js
// infra/controller.js
// passando a abstração que estava no endpoint /migration pra cá
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

// métodos também, pois não fazem parte do endpoint
// são apenas códigos de infra pra controlar erros
function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

const controller = {
  onNoMatchHandler,
  onErrorHandler,
};

export default controller;
```

E agora no /migrations

```js
const router = createRouter();

router.get(getHandler);
router.post(postHandler);

// chamamos assim os controllers com erros
export default router.handler({
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
});
```

Como o código foi centralizado, pode ser aplicado no endpoint /status, da mesma forma, removendo lógica de infra de lá.

```js
// abstraindo um pouco mais o método de manipulação de erros
// devolvendo um objeto com propriedades que possuem outros objetos dentro
const controller = {
  onNoMatchHandler,
  onErrorHandler,
};

// agora só é preciso adicionar ao errorHandlers demais propriedades
const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

// refatorando os endpoints, somente uma linha de código
export default router.handler(controller.errorHandlers);
```

## Tratamento de Serviços Externos

Serviços externos podem dar problema. É preciso ir direto ao ponto quando um banco de dados, e-mail, autenticação, integração e outros ficam indisponíveis.

A estratégia é a mesma: lançar um erro e abraçar o erro em um lugar especializado, conseguindo mudar o status code da resposta, ajudando a identificar a causa do problema.

```js
// alterando errors.js
// criamos um tratamento de erros especializados para serviços
export class ServiceError extends Error {
  // desestruturada a mensagem, permitindo que ela seja recebida
  // no momento em que for passada pelo runtime ou usada mensagem fallback padrão
  constructor({ cause, message }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Verifique se o serviço está disponível";
    this.statusCode = 503; // Serviço Indisponível
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

// database.js
// agora importamos o ServiceError para ser usado pelo serviço de banco de dados
// obs: uma boa prática é adicionar a importação o ".js", pra identificar que
// é um arquivo e não um diretório
import { ServiceError } from "./errors.js";

async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    // declaração do novo objeto de erro
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    });
    // joga o erro pro no processo, propagando pra abstração do controller,
    // chamando o onErrorHandler, que vai logar e responder a requisição.
    throw serviceErrorObject;
  } finally {
    client?.end();
  }
}
```

Para melhorar ainda mais o encadeamento de erros e deixar tudo mais organizado, podemos aplicar mais algumas refatorações pra trazer exatamento o código do erro.

```js
// errors.js
export class InternalServerError extends Error {
  // desestruturado objeto, recuperando o statusCode ou passando fallback
  constructor({ cause, statusCode }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

// controller.js
// agora no controller pode ser informado recuperado o statusCode
// no momento em que o erro está sendo tratado
function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.log(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}
```

Fazendo um teste pra simular o erro, alterado usuario do banco pra **user2**.

```bash
# erro público retornado para o client que fez a solicitação do endpoint
❯ curl -s http://localhost:3000/api/v1/status | jq
{
  "name": "InternalServerError",
  "message": "Um erro interno não esperado aconteceu.",
  "action": "Entre em contato com o suporte.",
  "status_code": 503
}

# logs no servidor
# no cabeçalho da requisição já temos o código do erro
GET /api/v1/status 503 in 11ms

# analisando os logs do servidor (mais recente pro mais antigo)
action: 'Verifique se o serviço está disponível',
statusCode: 503,
[cause]: error: password authentication failed for user "local_user2"

action: 'Entre em contato com o suporte.',
statusCode: 503,
[cause]: ServiceError [InternalServerError]: Erro na conexão com o Banco ou na Query.

InternalServerError: Um erro interno não esperado aconteceu.

# analisando agora a stack, como um log está encadeado no outro
InternalServerError: Um erro interno não esperado aconteceu.

  action: 'Entre em contato com o suporte.',
  statusCode: 503,
  [cause]: ServiceError [InternalServerError]: Erro na conexão com o Banco ou na Query.

    action: 'Verifique se o serviço está disponível',
    statusCode: 503,
    [cause]: error: password authentication failed for user "local_user2"
```

Olha como ficou mais fácil interpretar o log agora:

1. Foi lançado um erro no processo do tipo **InternalServiceError**.

1. A causa do erro foi um **ServiceError** relacionado ao serviço externo de banco de dados.

1. A causa do **ServiceError** foi um erro na autenticação do usuário **local_user2**. Se alterar as credenciais para o usuário correto, tudo volta ao normal.
