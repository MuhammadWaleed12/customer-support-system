import { beforeAll, describe, expect, it } from "vitest";
import { conversationService } from "./conversation.service.js";
import { prisma } from "../db/client.js";
import { NotFoundError } from "../lib/errors.js";

let aliceId: string;
let marcusId: string;

beforeAll(async () => {
  const alice = await prisma.user.findUniqueOrThrow({ where: { email: "alice@example.com" } });
  aliceId = alice.id;
  const marcus = await prisma.user.findUniqueOrThrow({ where: { email: "marcus@example.com" } });
  marcusId = marcus.id;
});

describe("conversationService.listByUser / getById", () => {
  it("lists alice's seeded conversation newest-first and loads its messages", async () => {
    const conversations = await conversationService.listByUser(aliceId);
    expect(conversations.length).toBeGreaterThan(0);

    const target = conversations.find((c) => c.title === "Where is my monitor order?");
    expect(target).toBeDefined();

    const details = await conversationService.getById(target!.id, aliceId);
    expect(details.messages.length).toBe(4);
    expect(details.messages[0]?.role).toBe("user");
    expect(details.messages.at(-1)?.agentType).toBe("order");
  });

  it("throws NotFoundError for an unknown conversation id", async () => {
    await expect(
      conversationService.getById("00000000-0000-0000-0000-000000000000", aliceId),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when a different user requests someone else's conversation", async () => {
    const conversations = await conversationService.listByUser(aliceId);
    const target = conversations.find((c) => c.title === "Where is my monitor order?")!;

    await expect(conversationService.getById(target.id, marcusId)).rejects.toThrow(NotFoundError);
  });
});

describe("conversationService.getRecentMessages", () => {
  it("returns messages oldest-to-newest, capped at the limit", async () => {
    const conversations = await conversationService.listByUser(aliceId);
    const target = conversations.find((c) => c.title === "Where is my monitor order?")!;

    const messages = await conversationService.getRecentMessages(target.id, 2);
    expect(messages).toHaveLength(2);
    expect(new Date(messages[0]!.createdAt).getTime()).toBeLessThanOrEqual(
      new Date(messages[1]!.createdAt).getTime(),
    );
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

    const details = await conversationService.getById(conversation.id, aliceId);
    expect(details.messages).toHaveLength(1);

    await expect(conversationService.remove(conversation.id, marcusId)).rejects.toThrow(
      NotFoundError,
    );

    await conversationService.remove(conversation.id, aliceId);

    await expect(conversationService.getById(conversation.id, aliceId)).rejects.toThrow(
      NotFoundError,
    );
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
