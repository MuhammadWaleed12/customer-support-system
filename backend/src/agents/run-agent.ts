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

export interface AgentRunResult {
  text: string;
  toolCalls: ToolCallRecord[];
}

/**
 * Delegates to the sub-agent matching the router's classification and waits
 * for the full response. Sub-agents stream internally (multi-step tool
 * calling needs it), but this call site awaits completion rather than
 * piping the live stream to the HTTP response — see phase-4-api-ui.md for
 * why token streaming is deferred past the "must ship" bar.
 */
export async function runAgent(
  agentType: RouterAgentType,
  userId: string,
  message: string,
  context: MessageDetails[],
): Promise<AgentRunResult> {
  const result =
    agentType === "order"
      ? runOrderAgent(message, context)
      : agentType === "billing"
        ? runBillingAgent(message, context)
        : agentType === "support"
          ? runSupportAgent(userId, message, context)
          : runFallbackAgent(message, context);

  const [text, rawToolCalls] = await Promise.all([result.text, result.toolCalls]);

  return {
    text,
    toolCalls: rawToolCalls.map((call) => ({ name: call.toolName, args: call.input })),
  };
}
