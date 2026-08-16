import type { Tool } from "ai";
import type { z } from "zod";
import { NotFoundError, ValidationError, ExternalServiceError } from "../../lib/errors.js";

/**
 * Wraps a service call as a tool, catching typed service errors and returning
 * them as a tool result the model can turn into prose (e.g. "I couldn't find
 * that order number") instead of letting them throw and abort the stream.
 * Domain tool files stay pure data-access wrappers; this is the one place in
 * the agent layer that knows how to fail gracefully.
 *
 * Builds the tool object directly rather than through the `tool()` helper:
 * `tool()` is a pure identity function used only for call-site type
 * inference, and its heavily overloaded generic signature resolves
 * incorrectly when INPUT/OUTPUT are forwarded through as type parameters
 * instead of literal types.
 */
export function createServiceTool<INPUT extends z.ZodTypeAny, OUTPUT>(config: {
  description: string;
  inputSchema: INPUT;
  execute: (input: z.infer<INPUT>) => Promise<OUTPUT>;
}): Tool<z.infer<INPUT>, OUTPUT | { error: string }> {
  return {
    description: config.description,
    inputSchema: config.inputSchema,
    execute: async (input: z.infer<INPUT>) => {
      try {
        return await config.execute(input);
      } catch (err) {
        if (
          err instanceof NotFoundError ||
          err instanceof ValidationError ||
          err instanceof ExternalServiceError
        ) {
          return { error: err.message };
        }
        throw err;
      }
    },
  } as unknown as Tool<z.infer<INPUT>, OUTPUT | { error: string }>;
}
