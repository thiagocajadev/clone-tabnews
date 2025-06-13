# 🏗️ Modelos de Trabalho

Em Tecnologia a evolução é constante. Os processos vão melhorando ao longo do tempo
conforme as metodologias vão sendo aprimoradas.

## 🌊 Waterfall ou Cascata

Esse modelo segue a ideia de queda d'Água.

Vem de cima pra baixo, com desdobramentos:

```flow
📝 Requisitos
└── 📈 Projeto
    └── 📜 Implementação - Devs
        └── 🔍 Validação
            └── 🤖 Implantação - Ops
```

Requisitos: Time de requisitos junto aos clientes internos e externos faz o levantamento da necessidade e definição da entrega final.

Projeto: Time de projetos analisa os requisitos e gera as definições: qual tecnologia a ser utilizada, qual arquitetura, linguagens, modelagens, estrutura de dados, libs, hospedagem, banco de dados, etc.

Implementação: Time de desenvolvedores `(Devs)` analisa as a documentação do projeto para implementar (desenvolver) do início ao fim.

Validação: Time de validação analisa o artefato (versão) gerada pelos desenvolvedores e faz as validações necessárias.

Implantação: Time de operações `(Ops)` recebe a validação e tem a responsabilidade de colocar pra funcionar a aplicação, fazendo o deploy em produção. Esse time recebe a maior carga, pois tem que fazer os ajustes finos pra tudo dar certo.

E aqui da muito problema, pois implantação fala com o cliente final. Se algo sai fora do planejado... e sempre sai, gera aquele desgaste 🧨🧨🧨

Ciclos cascate são longos. Imagina descobrir no final de 1 ano que será necessário mais 1 ano pra ajustar alguns pontos não observados nas etapas anteriores? Trágico.

Os desenvolvedores ficam ali no meio do caminho, sem poder participar de perto da implantação.

## ⏩ Surgimento do Ágil

Com esses problemas recorrentes, um time de especialistas se reuniu em 2001 para criar o Manifesto Ágil, para o desenvolvimento de software de forma ágil.

- `Indivíduos e interações primeiro`, depois processos e ferramentas.
- `Software em funcionamento primeiro`, depois documentação abrangente.
- `Colaboração com o cliente primeiro`, depois negociações de contratos.
- `Responder a mudanças primeiro`, depois seguir um plano.

Resumindo a prioridade de valor:

```code
Pessoas > Processos
Software funcionando > Documentação
Cliente junto > Contrato rígido
Adaptação > Plano fixo
```

Esse plano foi muito adotado. Mas, infelizmente como é algo interpretativo, algumas empresas começaram a escrever em pedra e criar processos rígidos em cima.

O ciclo de conflitos começou a se repetir.

Realmente é difícil vender o melhorar pessoas ao invés de processos. Quando o caminho pra tudo na vida é: `equilíbrio`.
