# ✍🏻 Commits

Commits são importantes para o controle de versão no código?

Sim, mas não precisam ser extremamente perfeitos.

Há softwares no mercado que apenas ignoram padrões. Em sua maioria são projetos de dev solo.

Agora quando olhamos para times e organizações, queremos ver o que há de melhor em controles e processos.

## Guia do Kernel Linux

Os commits do Kernel do Linux são extremamente rigorosos.

"Separe cada mudança lógica em um commit separado".

Código e Documentação são coisas separadas e ai está um bom exemplo pra começar.

Um commit para cada um é interessante.

Quando há alteração em um componente ou trecho de código para performance, temos um bom candidato para commit.

Assim como alterar esse mesmo componente para adicionar um novo recurso, deve ser feito em outro commit.

Performance, Feature, Correção... Cada ação deve ser tratada como um commit diferente.

"Cada commit deve ser justificável por seus próprios méritos".

O escopo de uma alteração precisa ter início, meio e fim.

No caso de uma alteração que altere diversos locais do sistema, gerando efeitos colaterais, o ideal é tratar isso como um commit com a conclusão total do processo.

> - Commit + Documentação: Uma reversão no caso de bug, obriga a corrigir o código e reescrever a documentação.

> - Commits separados: Precisam de alinhamento na atividade, para garantir ao final do processo toda alteração no código está sincronizada com a documentação.

Sempre é bom pensar: e se eu precisar voltar? Tudo volta funcionando como antes?

Se eu precisar pesquisar nos logs e verificar a data e hora, quanto tempo de exposição devido ao bug.

Essas informações são essenciais para um acompanhamento e tomada de ações pela equipe.
