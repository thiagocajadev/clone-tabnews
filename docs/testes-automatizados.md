# 🟢 Testes Automatizados

Continuando na mesma linha de raciocínio, construir uma aplicação em 2025 e não aproveitar e inserir a parte de testes é um desperdício.

Só há vantagens ao longo do processo. Sim, se perde um pouco mais de tempo para configurar e criar os testes.

Porém, se recupera esse tempo posteriormente, pois não será necessário ficar testando manualmente o sistema a cada alteração.

E o que é esse tal de teste automatizado?

Resumindo, é um código que testa o código o seu código. 🔴🟢

Então, você define o retorno esperado criando casos de teste. Ai basta executar a rotina que faz essa verificação.

## ✖️✔️ Instalando o Test Runner

Vamos usar o Jest, uma ferramenta popular, simples e atualizada.

```powershell
npm install --save-dev jest@29.6.2
```

Adicione aos scripts no package.json, o uso do `jest` por linha de comando:

```js
  "scripts": {
    "dev": "next dev",
    "lint:check": "prettier --check .",
    "lint:fix": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch"
  },
```

Pra executar, utilize `npm run test` ou apenas `npm test`. Se quiser ficar vigiando e testando a cada alteração, use o `npm test:watch`.
