import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireEnv } from "../lib/env.js";
import { toModelMessages } from "./lib/to-model-messages.js";
import { FALLBACK_SYSTEM_PROMPT } from "./prompts/fallback.prompt.js";
import type { MessageDetails } from "../services/conversation.service.js";

export function runFallbackAgent(message: string, context: MessageDetails[] = []) {
  return streamText({
    model: anthropic(requireEnv("AGENT_MODEL")),
    instructions: FALLBACK_SYSTEM_PROMPT,
    messages: toModelMessages(context, message),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });
}
