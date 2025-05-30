import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseInfo = await getDatabaseInfo();

  response.status(200).json({
    updated_at: updatedAt,
    database: {
      version: databaseInfo.server_version,
      max_connections: databaseInfo.max_connections,
      used_connections: databaseInfo.used_connections,
    },
  });
}

async function getDatabaseInfo() {
  const result = await database.query(
    `SELECT 
      current_setting('server_version') AS server_version,
      current_setting('max_connections') AS max_connections,
      (SELECT COUNT(*) FROM pg_stat_activity) AS used_connections;`,
  );
  const resultOneRow = result.rows[0];
  return resultOneRow;
}

export default status;
