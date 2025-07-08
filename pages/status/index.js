function CapsLock(props) {
  const textoEmCapsLock = props.texto.toUpperCase();

  return textoEmCapsLock;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <CapsLock texto="meu texto exibido em caixa alta" />
    </>
  );
}
