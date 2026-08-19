import { useState } from "react";

export default function RegisterPage() {
  console.log("Render do <RegisterPage>");

  const [newCount, setNewCount] = useState(0);
  console.log(newCount);
  console.log(setNewCount);

  let count = 0;
  console.log(`Count do render: ${count}`);
  console.log(`newCount do render: ${newCount}`);

  function increment() {
    console.log(`Count dentro de increment(): ${count}`);
    count = count + 1;
  }

  // function newIncrement() {
  //   console.log(`Count dentro de newIncrement(): ${newCount}`);
  //   setNewCount(newCount + 1);
  // }

  return (
    <>
      <h1>Count: {count}</h1>
      <button onClick={increment}>Incrementar</button>
      <ComponenteA />
      <ComponenteB />
    </>
  );
}

function ComponenteA() {
  console.log("Render do <ComponenteA>");
  return <h1>Componente A</h1>;
}

function ComponenteB() {
  console.log("Render do <ComponenteB>");
  return <h1>Componente B</h1>;
}
