import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  console.log("userInputValues:", userInputValues);

  const newUser = await user.create(userInputValues);
  console.log("newUser:", newUser);
  return response.status(201).json(newUser);
}
