import { describe, expect, it } from "vitest";
import { classifyIntent } from "./router.agent.js";
import type { MessageDetails } from "../services/conversation.service.js";

function fakeMessage(overrides: Partial<MessageDetails>): MessageDetails {
  return {
    id: "test-id",
    role: "user",
    content: "",
    agentType: null,
    reasoning: null,
    toolCalls: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("classifyIntent", () => {
  it("routes an order tracking question to the order agent", async () => {
    const decision = await classifyIntent("Can you tell me where my order ORD-1003 is?");
    expect(decision.agent).toBe("order");
    expect(decision.confidence).toBeGreaterThan(0.5);
    expect(decision.reasoning.length).toBeGreaterThan(0);
  });

  it("routes a refund question to the billing agent", async () => {
    const decision = await classifyIntent(
      "I never got my refund for invoice INV-2002, what's going on?",
    );
    expect(decision.agent).toBe("billing");
  });

  it("routes a general policy question to the support agent", async () => {
    const decision = await classifyIntent("What's your return policy for electronics?");
    expect(decision.agent).toBe("support");
  });

  it("routes a greeting to fallback", async () => {
    const decision = await classifyIntent("Hey there!");
    expect(decision.agent).toBe("fallback");
  });

  it("routes an off-topic message to fallback", async () => {
    const decision = await classifyIntent("What's the capital of France?");
    expect(decision.agent).toBe("fallback");
  });

  it("uses conversation context to disambiguate a short follow-up", async () => {
    const decision = await classifyIntent("What about the second one?", [
      fakeMessage({
        role: "user",
        content: "I have two orders, ORD-1003 and ORD-1004, are they both shipped?",
      }),
      fakeMessage({
        role: "assistant",
        content: "ORD-1003 is in transit. Let me check ORD-1004 too.",
        agentType: "order",
        reasoning: "Order status question",
      }),
    ]);
    expect(decision.agent).toBe("order");
  });
});
