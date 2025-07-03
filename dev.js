/* eslint-env es2020, node */
const { spawn, exec } = require("child_process");

function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`Erro ao executar "${cmd}". Código de saída: ${code}`),
        );
    });

    proc.on("error", reject);
  });
}

async function main() {
  try {
    await runCommand("npm", ["run", "services:up"]);
    await runCommand("npm", ["run", "services:wait:database"]);
    await runCommand("npm", ["run", "migrations:up"]);

    const nextProc = spawn("npx", ["next", "dev"], {
      stdio: "inherit",
      shell: true,
    });

    let alreadyStopped = false;

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

    const EXIT_SIGINT = 130;
    const EXIT_SIGTERM = 143;

    process.on("SIGINT", () => stopServices(EXIT_SIGINT));
    process.on("SIGTERM", () => stopServices(EXIT_SIGTERM));

    nextProc.on("close", (code) => stopServices(code));
  } catch (err) {
    console.error("❌ Erro durante dev:", err);
    exec("npm run services:stop", () => {
      console.log("⚠️ Serviços encerrados após erro.");
      process.exit(1);
    });
  }
}

main();
