test("GET to /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  console.log(responseBody);
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  // 1. Versão do Postgres
  const databaseVersion = "16.0";
  expect(responseBody.database.version).toBe(databaseVersion);

  // 2. Conexões Máximas
  const databaseMaxConnections = "100";
  expect(responseBody.database.max_connections).toBe(databaseMaxConnections);

  // 3. Conexões Usadas
  const databaseUsedConnections = "7";
  expect(responseBody.database.used_connections).toBe(databaseUsedConnections);
});
