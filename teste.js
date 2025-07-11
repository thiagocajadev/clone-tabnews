try {
  const error = new Error();
  console.log(error);
} catch (error) {
  console.log(error);
  console.log(typeof error);
}
