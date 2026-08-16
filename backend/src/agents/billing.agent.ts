import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireEnv } from "../lib/env.js";
import { toModelMessages } from "./lib/to-model-messages.js";
import { BILLING_SYSTEM_PROMPT } from "./prompts/billing.prompt.js";
import { getInvoiceDetails, checkRefundStatus } from "./tools/billing.tools.js";
import type { MessageDetails } from "../services/conversation.service.js";

export function runBillingAgent(message: string, context: MessageDetails[] = []) {
  return streamText({
    model: anthropic(requireEnv("AGENT_MODEL")),
    instructions: BILLING_SYSTEM_PROMPT,
    messages: toModelMessages(context, message),
    tools: { getInvoiceDetails, checkRefundStatus },
    stopWhen: stepCountIs(5),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });
}
