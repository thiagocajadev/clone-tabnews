function salvarUsuario(input) {
  if (!input) {
    throw new Error("error-input-undefined");
  }

  if (!input.name) {
    throw new Error("error-name-undefined");
  }

  user.save(input);
}

try {
  salvarUsuario({
    name: "Thiago Carvalho",
  });
} catch (error) {
  if (error.message === "error-input-undefined") {
    console.log("É necessário enviar um 'input'.");
    console.log(error.stack);
  }

  if (error.message === "error-name-undefined") {
    console.log("É necessário enviar o 'name'.");
    console.log(error.stack);
  }

  console.log("Erro desconhecido");
  console.log(error.stack);
}
