import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { requireEnv } from "../lib/env.js";
import { toModelMessages } from "./lib/to-model-messages.js";
import { ROUTER_SYSTEM_PROMPT } from "./prompts/router.prompt.js";
import type { MessageDetails } from "../services/conversation.service.js";

export const ROUTER_AGENT_TYPES = ["support", "order", "billing", "fallback"] as const;
export type RouterAgentType = (typeof ROUTER_AGENT_TYPES)[number];

const routerOutputSchema = z.object({
  agent: z.enum(ROUTER_AGENT_TYPES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type RouterDecision = z.infer<typeof routerOutputSchema>;

/**
 * A separate, non-streaming call producing a structured classification —
 * kept apart from the sub-agents so routing is unit-testable without
 * mocking a conversation, and so the UI gets a reasoning string for free.
 * No tools; the router only decides where the message goes.
 */
export async function classifyIntent(
  message: string,
  context: MessageDetails[] = [],
): Promise<RouterDecision> {
  const { output } = await generateText({
    model: anthropic(requireEnv("ROUTER_MODEL")),
    instructions: ROUTER_SYSTEM_PROMPT,
    output: Output.object({ schema: routerOutputSchema }),
    messages: toModelMessages(context, message),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });

  return output;
}
