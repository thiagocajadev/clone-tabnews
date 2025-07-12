class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

function salvarUsuario(input) {
  if (!input) {
    throw new ReferenceError("É necessário enviar o 'input'.");
  }

  if (!input.name) {
    throw new ValidationError("Preencha seu nome completo.");
  }

  if (!input.username) {
    throw new ValidationError("Preencha seu nome de usuário.");
  }

  if (!input.age) {
    throw new ValidationError("Preencha sua idade.");
  }

  user.save(input);
}

try {
  salvarUsuario({});
} catch (error) {
  if (error instanceof ReferenceError) {
    throw error;
  }

  if (error instanceof ValidationError) {
    console.log(error.statusCode);
    return; // response.status(400).json(error);
  }

  console.log("Erro desconhecido");
  console.log(error.stack);
}
