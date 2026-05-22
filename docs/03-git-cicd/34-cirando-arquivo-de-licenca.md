# 🧻 Licença do Projeto

A escolha da licença define como o software pode ser usado, modificado e distribuído. É essencial alinhar a licença com o objetivo do projeto: aberto ou fechado.

## Top 5 Licenças Mais Usadas

`MIT` – Simples, permissiva. Permite uso, modificação e distribuição com mínima restrição. Exige apenas manter os créditos.

`Apache 2.0` – Similar à MIT, mas inclui proteção contra patentes.

`GPLv3` – Copyleft forte. Alterações e derivados devem manter o código aberto sob a mesma licença.

`BSD 3-Clause` – Parecida com MIT, mas com cláusulas extras contra uso indevido de nomes e contribuição.

`LGPL` – Mais flexível que a GPL. Ideal para bibliotecas que podem ser usadas em projetos proprietários.

### Por que escolhi a MIT

Para projetos abertos, a MIT é prática e amplamente aceita. Permite colaboração sem amarrar quem usa o código. Ideal quando o foco é adoção e contribuição livre.

### E para software proprietário?

Se o projeto é fechado e você quer proteger o código, o ideal é não usar licença open source. Nesse caso:

Licença proprietária customizada: Define claramente os termos de uso, restrições, e garante controle total.

Evite licenças permissivas como MIT ou Apache — elas não impedem terceiros de reutilizar seu código.

## Criando uma licença direto pelo GitHub

Acesse o repositório do projeto `clone-tabnews -> Code -> Add file... -> Create new file`

Digite `LICENSE`. Nesse momento, a interface do GitHub fornece a opção `Chose a license template`

[Modelo de licenças do GitHub](img/github-license-template.png)

Ao selecionar a mesma, é definido ano e autor.

Após gerar o template, basta criar um novo arquivo na branch local chamado `LICENSE` e adicionar o conteúdo.

> Também é possível fazer os passos pelo github, criando uma branch remota e padronizando os commits
> para atender os requisitos do CI, conforme é indicado no processo.

E é só isso!
