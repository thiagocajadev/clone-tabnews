# 🍪 Autenticação por Session Cookie

Para armazenar um biscoito no pote de biscoitos no navegador do usuário (estranho né deixar o texto em português.. haha), usamos o `set-cookie`:

```bash
# Usando o cURL no terminal. Detalhes das instruções:
# -v: modo verboso mostrando o cabeçalho na request e na response
# -X: define o método para uso: GET, POST, PUT, PATCH, DELETE
# o uso de barra invertida "\" serve para quebra de linhas no comando, sendo necessário digitar a barra e apertar enter no terminal pra ele entender.
# Isso facilita a leitura e organização.
# -H: envia um cabeçalho customizado na Header
# -d: envia os dados no corpo da requisição
curl -v -X POST http://localhost:3000/api/v1/users \
-H "Content-Type: application/json" \
-d '{"email":"cookie@curso.dev","username":"cookie","password":"cookie"}'
```

Exemplo do retorno no terminal, com um novo usuário criado.

```bash
curl -v -X POST http://localhost:3000/api/v1/users \
∙ -H "Content-Type: application/json" \
∙ -d '{"email":"cookie@curso.dev","username":"cookie","password":"cookie"}'
Note: Unnecessary use of -X or --request, POST is already inferred.
* Host localhost:3000 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:3000...
* Connected to localhost (::1) port 3000
# flexinha de ida >, cabeçalho da requisição
> POST /api/v1/users HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.5.0
> Accept: */*
> Content-Type: application/json
> Content-Length: 68
>
# flexinha de retorno <, cabeçalho de resposta
< HTTP/1.1 201 Created
< Content-Type: application/json; charset=utf-8
< ETag: "9jjitdbah96u"
< Content-Length: 246
< Vary: Accept-Encoding
< Date: Fri, 01 Aug 2025 16:50:55 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Connection 0 to host localhost left intact
# objeto retornado
{"id":"d62cacda-a1fa-41f3-be3f-e1fac0c076d9","username":"cookie","email":"cookie@curso.dev","password":"$2b$04$jSbkS6zqKNPOL9ZRGSLOS.7jeJ7JNkhLZrwDOvCSPd7YsTHv/aZKC","created_at":"2025-08-01T16:50:55.634Z","updated_at":"2025-08-01T16:50:55.634Z"}
```

## Definindo o setHeader

Então, como precisamos armazenar o cookie no cookie jar, no browser do usuário na resposta da request, podemos utilizar:

```js
// api/v1/sessions/index.js
// outros códigos acima...
const newSession = await session.create(authenticatedUser.id);

// o método setHeader permite gravar informações no cabeçalho da resposta
// o session_id também é popularmente salvo como "sid"
response.setHeader("Set-Cookie", `session_id=${newSession.token}`);
```

Agora fazendo um post contra o endpoint **"/sessions"**:

```bash
curl -v -X POST http://localhost:3000/api/v1/sessions \
∙ -H "Content-Type: application/json" \
∙ -d '{"email":"cookie@curso.dev","username":"cookie","password":"cookie"}'

# retorno no terminal
curl -v -X POST http://localhost:3000/api/v1/sessions -H "Content-Type: application/json" -d '{"email":"cookie@curso.dev","username":"cookie","password":"cookie"}'
Note: Unnecessary use of -X or --request, POST is already inferred.
* Host localhost:3000 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:3000...
* Connected to localhost (::1) port 3000
> POST /api/v1/sessions HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.5.0
> Accept: */*
> Content-Type: application/json
> Content-Length: 68
>
< HTTP/1.1 201 Created
# foi criado um novo cookie no cabeçalho
< Set-Cookie: session_id=1fccf90a1b83d282315645824ee069f8bf45f65dcd04b33ca5b2ebcd8f88327c7ebcb60f521aea472d7074d3fbd061f7
< Content-Type: application/json; charset=utf-8
< ETag: "aa3p7c0hgl8x"
< Content-Length: 321
< Vary: Accept-Encoding
< Date: Fri, 01 Aug 2025 17:34:25 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Connection 0 to host localhost left intact
{"id":"43dc9227-33c6-4dbe-a0f8-6e4e68c59c9c","token":"1fccf90a1b83d282315645824ee069f8bf45f65dcd04b33ca5b2ebcd8f88327c7ebcb60f521aea472d7074d3fbd061f7","user_id":"098e0280-6665-4b35-9b87-aa32baca5b55","expires_at":"2025-08-31T17:34:25.231Z","created_at":"2025-08-01T17:34:25.235Z","updated_at":"2025-08-01T17:34:25.235Z"}
```

Muito legal! Porém, é preciso armazenar esse cookie em um navegador, então bora fazer no navegador.

## Guardando biscoitos no navegador

Entrando no modo de inspeção (F12) e abrindo o console, a melhor coisa é limpar o mesmo.

```js
// fazendo uma busca com fetch no console do navegador
fetch('api/v1/sessions', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      email: 'cookie@curso.dev',
      password: 'cookie'
  })
})

// entrando na aba network, todo trafego de requisição e resposta sempre passa pela rede
// copiando os cabeçalhos de retorno, mostrando o session_id salvo
HTTP/1.1 201 Created
Set-Cookie: session_id=4058eba1ccfd6ad2215f56d41a379df676839a9af71e6a77cd16245085f468e4931184a0f378c04ce9f1d8e98565b37d
Content-Type: application/json; charset=utf-8
ETag: "14otzalzhdb8x"
Content-Length: 321
Vary: Accept-Encoding
Date: Fri, 01 Aug 2025 17:55:07 GMT
Connection: keep-alive
Keep-Alive: timeout=5

// Outra visão legal é abrir a aba application e entender que cada diretório tem
// o seu próprio cookie jar. Se não especificado, o local do cookie jar no navegador
// será sua rota base mais próxima.
path = /api/v1
```

Para reaproveitar os cookies em todo o domínio, basta informar o caminho no setHeader:

```js
// Dessa forma, podemos definir as configurações do cookie
response.setHeader("Set-Cookie", `session_id=${newSession.token}; Path=/`);

// Apagando o cookie e repetindo o fetch no console do navegador,
// é possível ver em network a requisição sendo feita.
// Consultando o cabeçalho de retorno, temos
set-cookie
session_id=6d20ba78823fa396a6222a2...; Path=/
```

Na aba **Application** -> **Storage**, temos o biscoito salvo para o diretório raiz do site:

| Name       | Value                     | Path |
| ---------- | ------------------------- | ---- |
| session_id | 6d20ba78823fa396a6222a... | /    |

## Módulo Cookie

Para escrever mais propriedades de forma otimizada, como definir quando o cookie irá expirar, vamos instalar o o `módulo cookie`.

```js
// Instala o módulo e mantém a versão exata
npm i -E cookie@1.0.2
```

Agora temos a habilidade de serializar as informações do cookie.

```js
const setCookie = cookie.serialize("session_id", newSession.token, {
  path: "/",
  // tempo em segundos. No caso, 30 dias.
  maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
  // só aceita cookies se a conexão estiver usando https.
  // aqui uma forma de retornar verdadeiro só para ambiente de produção
  secure: process.env.NODE_ENV === "production",
});
response.setHeader("Set-Cookie", setCookie);
```

Diferença entre expires e maxAge:

**expires**=Wed, 21 Oct 2025 07:28:00 GMT → expira em data fixa (depende do relógio do PC)

**max-age**=3600 → expira em 1h a partir de agora (não depende do relógio)

Resumo:
**max-age** é mais confiável. **expires** pode falhar se o relógio do usuário estiver errado.

### Adicionando mais segurança

Ok, está bem mais fácil configurar com `setCookie`. Mas do jeito que está, usando um comando no console do navegador como `document.cookie`, é possível recuperar facilmente o **bilhete mágico**. Um hacker pode se aproveitar do cookie para fazer acessos indevidos.

```js
// Aqui restringimos a camada de acesso, evitando a recuperação no console via cliente side
httpOnly: true;
```

Agora o código javascript do lado do cliente nunca mais tem acesso ao valor do cookie e nem um hacker usando o ataque de `XSS`. Usando o comando `document.cookie`, não retorna nada.

> **XSS (Cross-Site Scripting):**
> É um ataque onde scripts maliciosos são injetados em páginas web, geralmente via campos de entrada. > O objetivo é roubar dados (como cookies), redirecionar usuários ou manipular a interface.
> Exemplo: `<script>stealCookies()</script>` inserido num formulário inseguro.

Exemplo do Cookie disponível em **Application** -> **Storage**:

| Name       | Value        | Path | Expires / MaxAge         | HttpOnly |
| ---------- | ------------ | ---- | ------------------------ | -------- |
| session_id | 0cc69ee42... | /    | 2025-09-01T15:41:19.820Z | ✅       |

## Módulo set-cookie-parser

Agora precisamos recuperar o cookie e converter ele em um objeto javascript pra fazer testes.

```bash
# Instala a versão exata como dependência de desenvolvimento
npm i -E -D set-cookie-parser@2.7.1
```

Usando no teste:

```js
// Recuperando o cookie
// api/v1/sessions/post.test.js
const parsedSetCookie = setCookieParser(response);
console.log(parsedSetCookie);

// log no console
// é devolvido um array, onde podem existir mais cookies
[
  {
    name: "session_id",
    value: "fa14dbe38de1e5d4774b031a9e4a1...",
    maxAge: 2592000,
    path: "/",
    httpOnly: true,
  },
];

// pra retornar um objeto, basta usar a propriedade map
const parsedSetCookie = setCookieParser(response, {
  map: true,
});

// no assertion, basta especificar o session_id
expect(parsedSetCookie.session_id).toEqual({
  name: "session_id",
  value: responseBody.token,
  maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
  path: "/",
  httpOnly: true,
});
```
