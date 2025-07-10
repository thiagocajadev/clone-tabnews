import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedStatus />
    </>
  );
}

function UpdatedStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (isLoading || !data) {
    return <div>Carregando...</div>;
  }

  const { updated_at, dependencies } = data;
  const db = dependencies.database;

  return (
    <div>
      <div>
        Última atualização: {new Date(updated_at).toLocaleString("pt-BR")}
      </div>
      <div>Banco de dados:</div>
      <ul>
        <li>Versão: {db.version}</li>
        <li>Conexões máximas: {db.max_connections}</li>
        <li>Conexões abertas: {db.opened_connections}</li>
      </ul>
    </div>
  );
}
