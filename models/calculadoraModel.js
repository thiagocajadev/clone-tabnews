function somar(numero1, numero2) {
  if (typeof numero1 !== "number" || typeof numero2 !== "number") {
    return "erro";
  }

  return numero1 + numero2;
}

function dividir(numero1, numero2) {
  if (typeof numero1 !== "number" || typeof numero2 !== "number") {
    return "erro: parâmetros inválidos";
  }

  if (numero2 === 0) {
    return "erro: divisão por zero";
  }

  return numero1 / numero2;
}

exports.somar = somar;
exports.dividir = dividir;
