# 🪛 Manutenção

Focando agora em atualizar as dependências de pacotes para versões mais seguras e estáveis, vamos entender mais sobre versionamento.

Existem formas de controle manuais como adicionar v1, v2, v3 ou R201042

## Versão Semântica

`Semantic Version` ou `SemVer` é um padrão de versionamento que segue a estrutura:

- `MAJOR` – Mudanças incompatíveis na API.
- `MINOR` – Adição de funcionalidades de forma retrocompatível.
- `PATCH` – Correções de bugs de forma retrocompatível.

> Versão da Aplicação [Major].[Minor].[Patch].  
> Ex: Node v[18].[20].[8]

Analisando a versão do `Node` nesse projeto:

- `[18]` → Versão principal (breaking changes)
- `[20]` → Novas funcionalidades sem quebrar o que já existe
- `[8]` → Correções de bugs

### Regras básicas:

- Ao quebrar compatibilidade, incremente `MAJOR`.
- Ao adicionar funcionalidade compatível, incremente `MINOR`.
- Ao corrigir bug, incremente `PATCH`.

## Prefixos comuns em gerenciadores de pacotes

### NPM / NuGet / outros:

- `^1.2.3` – Permite atualizações que **não** alteram o primeiro número (`MAJOR`).
- `~1.2.3` – Permite atualizações que **não** alteram o `MINOR`.
- `1.2.x` – Qualquer versão `PATCH`.
- `1.x` – Qualquer versão `MINOR` e `PATCH`, desde que o `MAJOR` seja 1.

> Para um controle de estabilidade é muito importante manter o package-lock.json no projeto.  
> Ele congela as versões dos pacotes e dependências, garantindo que tudo está funcionando até aquele momento.

## Boas práticas

- Sempre ler o changelog antes de atualizar uma dependência.
- Priorizar versões estáveis (evite betas/alphas em produção).
- Automatizar atualizações com ferramentas como `Dependabot`, mas revisar antes de subir.

## Checando versões com NPM

```bash
# verifica pacotes desatualizados que possuem atualização disponível
npm outdated

# trecho do log
npm outdated
Package        Current   Wanted   Latest  Location                Depended by
prettier         3.5.3    3.6.1    3.6.1  node_modules/prettier   clone-tabnews
react           18.2.0   18.3.1   19.1.0  node_modules/react      clone-tabnews
react-dom       18.2.0   18.3.1   19.1.0  node_modules/react-dom  clone-tabnews
```

- Current: versão atual do módulo
- Wanted: versão tolerável. Pode ser atualizada até a última versão MINOR disponível.
- Latest: versão mais recente.

Verificando brechas de segurança

```bash
# gera relatório de auditoria
npm audit

# log no terminal
# npm audit report

brace-expansion  1.0.0 - 1.1.11
brace-expansion Regular Expression Denial of Service vulnerability - https://github.com/advisories/GHSA-v6h2-p8h4-qcjw
fix available via `npm audit fix`
node_modules/brace-expansion

next  <=14.2.29
Severity: critical
Next.js missing cache-control header may lead to CDN caching empty reply - https://github.com/advisories/GHSA-c59h-r6p8-q9wc
Denial of Service condition in Next.js image optimization - https://github.com/advisories/GHSA-g77x-44xx-532m
Next.js authorization bypass vulnerability - https://github.com/advisories/GHSA-7gfc-8cq8-jh5f
Next.js Allows a Denial of Service (DoS) with Server Actions - https://github.com/advisories/GHSA-7m27-7ghc-44w9
Authorization Bypass in Next.js Middleware - https://github.com/advisories/GHSA-f82v-jwr5-mffw
Next.js Race Condition to Cache Poisoning - https://github.com/advisories/GHSA-qpjv-v59x-3qc4
Information exposure in Next.js dev server due to lack of origin verification - https://github.com/advisories/GHSA-3h52-269p-cp9r
Depends on vulnerable versions of postcss
fix available via `npm audit fix --force`
Will install next@15.3.4, which is a breaking change
node_modules/next

postcss  <8.4.31
Severity: moderate
PostCSS line return parsing error - https://github.com/advisories/GHSA-7fh5-64p2-3v2j
fix available via `npm audit fix --force`
Will install next@15.3.4, which is a breaking change
node_modules/postcss

3 vulnerabilities (1 low, 1 moderate, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
```

Então para iniciar a manutenção, o primeiro passo é remover o acento circunflexo `^` das versões no `package.json`, travando assim potenciais instalações automatizadas do NPM.

Em seguida, executar `npm install` ou `npm i` para recriar o `package-lock.json`.

Pra finalizar, executar um npm test pra ver se está tudo ok, seguido por um commit.

## Atualizando de forma interativa

Vamos instalar de forma temporária o módulo `npm-check-updates` pra facilitar nossa vida.

```bash
npx npm-check-updates -i

# log
clone-tabnews on  maintenance is 📦 v1.0.0 via  v18.20.8
❯ npx npm-check-updates -i
Need to install the following packages:
npm-check-updates@18.0.1
Ok to proceed? (y) y

Upgrading /home/thiago/git/clone-tabnews/package.json
[====================] 21/21 100%

? Choose which packages to update ›
  ↑/↓: Select a package
  Space: Toggle selection
  a: Toggle all
  Enter: Upgrade

❯ ◉ @commitlint/cli                  19.3.0  →  19.8.1
  ◉ @commitlint/config-conventional  19.2.2  →  19.8.1
  ◉ commitizen                        4.3.0  →   4.3.1
  ◉ concurrently                      8.2.2  →   9.2.0
  ◉ dotenv                           16.4.4  →  16.5.0
  ◉ dotenv-expand                    11.0.6  →  12.0.2
  ◉ eslint                           8.57.0  →  9.29.0
  ◉ eslint-config-next               14.2.4  →  15.3.4
  ◉ eslint-config-prettier            9.1.0  →  10.1.5
  ◉ eslint-plugin-jest               28.6.0  →  29.0.1
  ◉ husky                             9.1.4  →   9.1.7
  ◉ jest                             29.6.2  →  30.0.3
  ◉ next                             13.1.6  →  15.3.4
  ◉ node-pg-migrate                   6.2.2  →   8.0.3
  ◉ pg                               8.11.3  →  8.16.2
  ◉ prettier                          3.5.3  →   3.6.1
  ◉ react                            18.2.0  →  19.1.0
  ◉ react-dom                        18.2.0  →  19.1.0
```

Uma boa prática é desmarcar todas as opções (apertando `a`) e iniciar as atualizações da menor modificação para maior (patch -> minor -> major).

Marque com a `Barra de espaço` o módulo e depois aperte `Enter` para atualizar.

Ex: commitizen só muda o patch, ótimo pra começar: commitizen 4.3.0 → 4.3.1

```bash
✔ Choose which packages to update ›

 commitizen  4.3.0  →  4.3.1

✔ Run npm install to install new versions? … yes
Installing dependencies...

> clone-tabnews@1.0.0 prepare
> husky


changed 1 package, and audited 727 packages in 2s

202 packages are looking for funding
  run `npm fund` for details

3 vulnerabilities (1 low, 1 moderate, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

Done
```

Terminou de atualizar, execute os testes relacionados ao módulo especifico pra confirmar que está tudo ok.

> 💡 A cada atualização de pacote, faça um commit. Como a mensagem será a mesma em todos os casos, pode ser feito um commit --amend

## Peer Dependencies

Também pode ser chamada de dependência de pares, são as dependências internas dentro de algum módulo que são compatíveis com uma versão determinada.

```bash
# tentando atualizar o plugin do jest para mesma versão atualizada na época
# da gravação do curso
clone-tabnews on  maintenance [!] is 📦 v1.0.0 via  v18.20.8 took 2m21s
❯ npm install eslint-plugin-jest@28.8.0
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: clone-tabnews@1.0.0
npm error Found: eslint-plugin-jest@28.6.0
npm error node_modules/eslint-plugin-jest
npm error   dev eslint-plugin-jest@"28.8.0" from the root project
npm error
npm error Could not resolve dependency:
npm error dev eslint-plugin-jest@"28.8.0" from the root project
npm error
npm error Conflicting peer dependency: @typescript-eslint/parser@8.35.0
npm error node_modules/@typescript-eslint/parser
npm error   peer @typescript-eslint/parser@"^8.35.0" from @typescript-eslint/eslint-plugin@8.35.0
npm error   node_modules/@typescript-eslint/eslint-plugin
npm error     peerOptional @typescript-eslint/eslint-plugin@"^6.0.0 || ^7.0.0 || ^8.0.0" from eslint-plugin-jest@28.8.0
npm error     node_modules/eslint-plugin-jest
npm error       dev eslint-plugin-jest@"28.8.0" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /home/thiago/.npm/_logs/2025-06-26T15_24_41_262Z-eresolve-report.txt
npm error A complete log of this run can be found in: /home/thiago/.npm/_logs/2025-06-26T15_24_41_262Z-debug-0.log
```

### Dependências privadas

As dependências privadas de cada módulo podem trabalhar com versões distintas. Por isso, o node pode instalar o jest 2 vezes no projeto.

Como são privadas, não há conflito. A questão que gera problemas é quando usamos plugins.

Partindo para um exemplo com react e react-dom

```js
// exemplo de dependência entre o react core e seu plugin, o react-dom
// trecho do node_modules/react-dom/package.json
// pra rodar o react dom, a dependência privada dele é o react nessa versão
  "peerDependencies": {
    "react": "^18.2.0"
  },
```

> O `react-dom` não funciona sem o `react`, e ele espera que o `react` esteja na versão `18.2.0` ou superior compatível.

O que significa `^18.2.0`?

Esse é o range selector "caret", que permite:

```text
>=18.2.0 e <19.0.0
```

Ou seja, aceita qualquer versão **menor que a próxima major**, começando em `18.2.0`.

> O SemVer e range selectors são usados pelos gerenciadores de pacotes para atualizações, resolvendo a ramificação de dependências.

Resumindo:

- Dependências privadas: isoladas → pode ter versões diferentes no projeto.
- peerDependencies: compartilham a instância → exigem versão compatível já instalada.
- Plugins geralmente são peerDependencies → conflitos são comuns.
- `^18.2.0` = aceita da `18.2.0` até antes da `19.0.0`.

### Erro de dependência conflitante (ERESOLVE)

Vamos por partes pra entender o que aconteceu.

```tree
projeto
├── jest: "29.x.x"
└── next: "13.x.x"
    └── jest: "25.x.x"
```

A versão `28.8.0` do `eslint-plugin-jest` **exige uma versão específica** de uma dependência indireta:

```text
@typescript-eslint/eslint-plugin@8.35.0
```

Essa dependência, por sua vez, **exige exatamente**:

```text
@typescript-eslint/parser@^8.35.0
```

Ou seja, se você não tiver esse parser **exatamente compatível**, o `npm` trava.

Provavelmente já temos outra versão do `@typescript-eslint/parser` instalada, ou nem tem ele listado explicitamente.

Então o `npm` fica sem saber como resolver a versão correta, e **dá erro**.

### ✅ Como resolver (opções)

1. **Ou, instale manualmente as versões exatas esperadas:**
   Verifique se você tem no `package.json`:

   ```json
   "@typescript-eslint/parser": "^8.35.0",
   "@typescript-eslint/eslint-plugin": "^8.35.0"
   ```

   Se não tiver, instale:

   ```bash
   npm install @typescript-eslint/parser@8.35.0 @typescript-eslint/eslint-plugin@8.35.0 --save-dev
   ```

   Depois disso, instale o plugin do Jest:

   ```bash
   npm install eslint-plugin-jest@28.8.0
   ```

   Também pode ser removido de forma recursiva o package-lock dentro do node_modules e rodar o npm install para ele criar um novo package-lock, resolvendo os conflitos

   ```bash
   rm -rf package-lock.json node_modules/
   npm i
   ```

1. **Mais fácil e direto:**
   Use a flag para ignorar o erro e instalar mesmo assim:

   ```bash
   npm install eslint-plugin-jest@28.8.0 --legacy-peer-deps
   ```

1. **Ou, forçando a instalação (menos recomendado):**

   ```bash
   npm install eslint-plugin-jest@28.8.0 --force
   ```

> Comandos para forçar ou ignorar pra ir mais rápido pode trazer um débito técnico futuro.
> Então fica sempre a recomendação do bom senso e análise cautelosa.

### Resumo rápido

- O `eslint-plugin-jest@28.8.0` exige outras libs (`@typescript-eslint/*`) em versões específicas.
- O projeto não tem isso compatível, então o `npm` não consegue resolver.
- Podemos então:
  - Ignorar com `--legacy-peer-deps`
  - Ajustar tudo manualmente
