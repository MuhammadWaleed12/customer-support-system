import type { ErrorHandler } from "hono";
import { NotFoundError, ValidationError, ExternalServiceError } from "../lib/errors.js";

export const errorMiddleware: ErrorHandler = (err, c) => {
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400);
  if (err instanceof ExternalServiceError) return c.json({ error: err.message }, 502);

  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
};
