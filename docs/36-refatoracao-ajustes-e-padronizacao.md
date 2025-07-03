# 🪛 Refatoração

**Efeito estilingue infinito:** Ficar esticando sem parar, pensando em acertar o alvo.

Perceba e saia desse efeito. Coloque prazos e entregas razoáveis pra fechar milestones.

Em projetos pessoais, temos uma maior tendencia em ficar refinando e detalhando, buscando a perfeição.

Quanto mais energia no projeto, mais distante chega ao fim.

## Ajustando scripts

Vamos organizar e renomear os scripts do `package.json`

```json
  "scripts": {
    "dev": "npm run services:up && npm run services:wait:database && npm run migrations:up && next dev",
    // testes vieram pra cima, pois são os comandos mais usados que devem ficar no topo
    "test": "npm run services:up && concurrently --names next,jest --hide next -k -s command-jest...",
    "test:watch": "jest --watchAll --runInBand",
    "services:up": "docker compose -f infra/compose.yaml up -d",
    "services:stop": "docker compose -f infra/compose.yaml stop",
    "services:down": "docker compose -f infra/compose.yaml down",
    // padronizado script do Postgres
    "services:wait:database": "node infra/scripts/services:wait:database.js",
    // migration foi pro plural, que é o mais comum
    "migrations:create": "node-pg-migrate -m infra/migrations create",
    "migrations:up": "node-pg-migrate -m infra/migrations --envPath .env.development up",
    "lint:prettier:check": "prettier --check .",
    "lint:prettier:fix": "prettier --write .",
    "lint:eslint:check": "next lint --dir .",
    "prepare": "husky",
    "commit": "cz"
  },
```

Após cada alteração, pode ser feito um `commit` e `push` pra registro.

```bash
# comandos executados em sequência
git add package.json && npm run commit && git push
```

## NPM pre e post

O gerenciador de pacotes do node NPM, permite a criação de scripts especiais `pre` e `post`.

- pre + nome do script: antes de executar o script.
- post + nome do script: após executar o script.

```json
"scripts": {
  "predev": "antes de executar o script npm run dev",
  "dev": "npm run services:up && npm run services:wait:database && npm run migrations:up && next dev",
  "postdev": "depois de executar o npm run dev",
}
```

O problema desses scripts é em caso de interrupção forçada como `ctrl + C`, eles não são executados.

Para fazer algo mais seguro, que funciona nos principais Sistemas Operacionais, podemos criar um script mais apurado.

```js
// criado na raiz do projeto o dev.js
/* eslint-env es2020, node */

/**
 * Este script é compatível com Windows, Linux e macOS.
 * Ele gerencia a inicialização e finalização do ambiente de desenvolvimento,
 * garantindo que os serviços Docker sejam encerrados corretamente mesmo após Ctrl+C ou kill.
 * Usa apenas recursos nativos do Node.js (child_process, sinais, spawn com shell).
 */

const { spawn, exec } = require("child_process");

// Executa comandos e retorna uma Promise para uso com async/await
function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit", // Redireciona stdout/stderr para o terminal atual
      shell: true, // Permite executar comandos do shell (npm, npx etc.)
    });

    // Ao encerrar normalmente
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`Erro ao executar "${cmd}". Código de saída: ${code}`),
        );
    });

    // Se ocorrer erro ao iniciar o processo
    proc.on("error", reject);
  });
}

async function main() {
  try {
    // Inicia os containers Docker
    await runCommand("npm", ["run", "services:up"]);

    // Aguarda o banco de dados estar pronto
    await runCommand("npm", ["run", "services:wait:database"]);

    // Aplica as migrations
    await runCommand("npm", ["run", "migrations:up"]);

    // Inicia o servidor Next.js em modo desenvolvimento
    const nextProc = spawn("npx", ["next", "dev"], {
      stdio: "inherit",
      shell: true,
    });

    let alreadyStopped = false; // Evita múltiplas execuções do stop

    // Encerra os serviços Docker de forma segura
    const stopServices = (code = 0) => {
      if (alreadyStopped) return;
      alreadyStopped = true;

      console.log("\n⏳ Encerrando serviços...");
      exec("npm run services:stop", () => {
        const finalCode = code ?? 0;
        console.log(`✅ Serviços encerrados com exit code ${finalCode}`);
        process.exit(finalCode);
      });
    };

    // Códigos padrão para interrupções por sinal
    const EXIT_SIGINT = 130; // Ctrl + C (SIGINT)
    const EXIT_SIGTERM = 143; // kill (SIGTERM)

    // Captura Ctrl+C e kill
    process.on("SIGINT", () => stopServices(EXIT_SIGINT));
    process.on("SIGTERM", () => stopServices(EXIT_SIGTERM));

    // Encerra serviços se o processo Next sair naturalmente
    nextProc.on("close", (code) => stopServices(code));
  } catch (err) {
    // Em caso de erro, encerra serviços com código de falha
    console.error("❌ Erro durante dev:", err.message);
    exec("npm run services:stop", () => {
      console.log("⚠️ Serviços encerrados após erro.");
      process.exit(1);
    });
  }
}

main();
```

E agora, basta chamar ele no package.json

```json
"scripts": {
  "dev": "node dev.js",
}
```

Como fica o log agora ao encerrar o Next:

```bash
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Environments: .env.development

✓ Starting...
✓ Ready in 982ms
^C
⏳ Encerrando serviços...

✅ Serviços encerrados com exit code 130
```

Agora sim o docker para também!
