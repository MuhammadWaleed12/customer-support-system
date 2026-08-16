import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireEnv } from "../lib/env.js";
import { toModelMessages } from "./lib/to-model-messages.js";
import { SUPPORT_SYSTEM_PROMPT } from "./prompts/support.prompt.js";
import { createSearchConversationHistoryTool } from "./tools/support.tools.js";
import type { MessageDetails } from "../services/conversation.service.js";

export function runSupportAgent(userId: string, message: string, context: MessageDetails[] = []) {
  return streamText({
    model: anthropic(requireEnv("AGENT_MODEL")),
    instructions: SUPPORT_SYSTEM_PROMPT,
    messages: toModelMessages(context, message),
    tools: { searchConversationHistory: createSearchConversationHistoryTool(userId) },
    stopWhen: stepCountIs(5),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });
}
