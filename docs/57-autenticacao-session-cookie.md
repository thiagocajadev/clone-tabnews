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

```
