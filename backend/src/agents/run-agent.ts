import { runOrderAgent } from "./order.agent.js";
import { runBillingAgent } from "./billing.agent.js";
import { runSupportAgent } from "./support.agent.js";
import { runFallbackAgent } from "./fallback.agent.js";
import type { RouterAgentType } from "./router.agent.js";
import type { MessageDetails } from "../services/conversation.service.js";

export interface ToolCallRecord {
  name: string;
  args: unknown;
}

/**
 * Delegates to the sub-agent matching the router's classification and
 * returns its live stream result unawaited, so the caller can forward text
 * deltas to the client as they arrive.
 */
export function dispatchAgent(
  agentType: RouterAgentType,
  userId: string,
  message: string,
  context: MessageDetails[],
) {
  switch (agentType) {
    case "order":
      return runOrderAgent(message, context);
    case "billing":
      return runBillingAgent(message, context);
    case "support":
      return runSupportAgent(userId, message, context);
    case "fallback":
    default:
      return runFallbackAgent(message, context);
  }
}
