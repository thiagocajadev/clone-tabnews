import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const defaultMigrationsConfig = {
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    console.log("Método GET");

    const pendingMigrations = await migrationRunner(defaultMigrationsConfig);
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    console.log("Método POST");

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsConfig,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  }

  return response.status(405).end();
}
