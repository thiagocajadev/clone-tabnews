const calculadora = require("../models/calculadoraModel.js");

test("somar 2 + 2 deve ser 4", () => {
  const resultado = calculadora.somar(2, 2);
  expect(resultado).toBe(4);
});

test("somar 5 + 100 deve ser 105", () => {
  const resultado = calculadora.somar(5, 100);
  expect(resultado).toBe(105);
});

test("somar 'banana' + 100 deve ser 'erro'", () => {
  const resultado = calculadora.somar("banana", 100);
  expect(resultado).toBe("erro");
});
