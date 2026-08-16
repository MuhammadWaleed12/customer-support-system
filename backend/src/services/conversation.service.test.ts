import { beforeAll, describe, expect, it } from "vitest";
import { conversationService } from "./conversation.service.js";
import { prisma } from "../db/client.js";
import { NotFoundError } from "../lib/errors.js";

let aliceId: string;

beforeAll(async () => {
  const alice = await prisma.user.findUniqueOrThrow({ where: { email: "alice@example.com" } });
  aliceId = alice.id;
});

describe("conversationService.listByUser / getById", () => {
  it("lists alice's seeded conversation newest-first and loads its messages", async () => {
    const conversations = await conversationService.listByUser(aliceId);
    expect(conversations.length).toBeGreaterThan(0);

    const target = conversations.find((c) => c.title === "Where is my monitor order?");
    expect(target).toBeDefined();

    const details = await conversationService.getById(target!.id);
    expect(details.messages.length).toBe(4);
    expect(details.messages[0]?.role).toBe("user");
    expect(details.messages.at(-1)?.agentType).toBe("order");
  });

  it("throws NotFoundError for an unknown conversation id", async () => {
    await expect(
      conversationService.getById("00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("conversationService.getRecentMessages", () => {
  it("returns messages oldest-to-newest, capped at the limit", async () => {
    const conversations = await conversationService.listByUser(aliceId);
    const target = conversations.find((c) => c.title === "Where is my monitor order?")!;

    const messages = await conversationService.getRecentMessages(target.id, 2);
    expect(messages).toHaveLength(2);
    expect(messages[0]!.createdAt.getTime()).toBeLessThanOrEqual(messages[1]!.createdAt.getTime());
  });
});

describe("conversationService.searchHistory", () => {
  it("finds a seeded message referencing an order number", async () => {
    const results = await conversationService.searchHistory(aliceId, "ORD-1003");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.message.content).toContain("ORD-1003");
  });

  it("returns no results for a query that matches nothing", async () => {
    const results = await conversationService.searchHistory(aliceId, "xyzzy-no-match-string");
    expect(results).toHaveLength(0);
  });
});

describe("conversationService create / addMessage / remove round trip", () => {
  it("creates a conversation, appends a message, then cleans up fully", async () => {
    const conversation = await conversationService.create(aliceId, "Test conversation");
    expect(conversation.title).toBe("Test conversation");

    const message = await conversationService.addMessage(conversation.id, {
      role: "user",
      content: "This is a throwaway test message.",
    });
    expect(message.content).toBe("This is a throwaway test message.");

    const details = await conversationService.getById(conversation.id);
    expect(details.messages).toHaveLength(1);

    await conversationService.remove(conversation.id);

    await expect(conversationService.getById(conversation.id)).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when adding a message to a missing conversation", async () => {
    await expect(
      conversationService.addMessage("00000000-0000-0000-0000-000000000000", {
        role: "user",
        content: "orphaned",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
