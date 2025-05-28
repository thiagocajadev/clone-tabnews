function status(request, response) {
  response.status(200).json({
    chave: "o status está ok!",
  });
}

export default status;
