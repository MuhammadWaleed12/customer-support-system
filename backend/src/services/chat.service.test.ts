import { afterEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../lib/errors.js";
import { chatService, type ChatStreamEvent } from "./chat.service.js";
import { conversationService } from "./conversation.service.js";

async function readEvents(stream: ReadableStream<Uint8Array>): Promise<ChatStreamEvent[]> {
  const payload = await new Response(stream).text();
  return payload
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChatStreamEvent);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chatService error events", () => {
  it("preserves messages from user-safe typed errors", async () => {
    vi.spyOn(conversationService, "getById").mockRejectedValue(
      new NotFoundError("Conversation not found"),
    );

    const events = await readEvents(
      chatService.streamMessage({
        userId: "user-1",
        conversationId: "conversation-1",
        content: "Hello",
      }),
    );

    expect(events).toEqual([{ type: "error", message: "Conversation not found" }]);
  });

  it("does not expose unexpected internal error details", async () => {
    vi.spyOn(conversationService, "getById").mockRejectedValue(
      new Error("database password rejected"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const events = await readEvents(
      chatService.streamMessage({
        userId: "user-1",
        conversationId: "conversation-1",
        content: "Hello",
      }),
    );

    expect(events).toEqual([{ type: "error", message: "Something went wrong." }]);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
  });
});
