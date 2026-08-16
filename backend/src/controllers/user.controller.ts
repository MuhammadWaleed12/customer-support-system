import { createFactory } from "hono/factory";
import { userService } from "../services/user.service.js";

const factory = createFactory();

export const listUsers = factory.createHandlers(async (c) => {
  const users = await userService.list();
  return c.json(users);
});
