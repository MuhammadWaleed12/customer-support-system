import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireEnv } from "../lib/env.js";
import { toModelMessages } from "./lib/to-model-messages.js";
import { ORDER_SYSTEM_PROMPT } from "./prompts/order.prompt.js";
import { fetchOrderDetails, checkDeliveryStatus } from "./tools/order.tools.js";
import type { MessageDetails } from "../services/conversation.service.js";

export function runOrderAgent(message: string, context: MessageDetails[] = []) {
  return streamText({
    model: anthropic(requireEnv("AGENT_MODEL")),
    instructions: ORDER_SYSTEM_PROMPT,
    messages: toModelMessages(context, message),
    tools: { fetchOrderDetails, checkDeliveryStatus },
    stopWhen: stepCountIs(5),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });
}
