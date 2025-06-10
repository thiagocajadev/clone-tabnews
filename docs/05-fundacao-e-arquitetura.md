# 🏗️ Fundação e Arquitetura

Para qualquer construção de projeto, avaliar o onde e o que será construído é essencial.

Qual é o proposito da solução? Qual o resultado esperado? O que será entregue de valor? Há praticidade e agilidade no uso?

Se perguntar e encontrar algumas dessas respostas ajustam a rota pelo caminho do desenvolvimento. Seguir um roteiro traz segurança.

## 🗂️ Arquitetura de Software e Organização de Pastas

Menos é mais! Comece sempre do mais simples e adicione complexidade moderada apenas quando necessário (KISS - Keep It Stupid Simple ou Keep It Simple, Stupid! 🤪).

Existem tantas siglas, Domain Driven Design - DDD, TDD, etc... e por quê não Desenvolvimento Orientado a Manutenção e Evolução do Código?

Combinar técnicas simples de organização de código,testes, pastas e arquivos é o caminho feliz.

A diferença entre **Arquitetura de Software** e **Arquitetura de Pastas** é o `Escopo dos componentes`.

Da pra colocar todos os arquivos dentro de uma única pasta. Mas conforme o projeto cresce, pode começar a conflitar nomes de arquivos, ambiguidade em partes do código, pesquise mais lenta...

Isso não é legal né? Põe na mente antes de tomar uma decisão: "Qual é o SALDO disso? 📉".

Abaixo organização básica, mais orgânica:

```
📦 root
├── 📂 pages
│   └── 📜 index.js
├── 📂 models
│   ├── 📜 user.js
│   ├── 📜 content.js
│   └── 📜 password.js
├── 📂 infra
│   ├── 📜 database.js
│   ├── 📁 migrations
│   └── 📂 provisioning
│       ├── 📁 staging
│       └── 📁 production
└── 📁 tests
```

Encontrei essa ferramenta pra desenhar [arvores](https://tree.nathanfriend.com/) 🌲 (estrutura de pastas) e achei legal demais!
