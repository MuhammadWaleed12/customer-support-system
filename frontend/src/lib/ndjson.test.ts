import { describe, expect, it, vi } from "vitest";
import { consumeNdjsonStream, NdjsonParseError } from "./ndjson";

function streamFrom(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe("consumeNdjsonStream", () => {
  const encoder = new TextEncoder();

  it("parses events split across chunks and awaits handlers in order", async () => {
    const events: Array<{ id: number }> = [];
    const onEvent = vi.fn(async (event: { id: number }) => {
      await Promise.resolve();
      events.push(event);
    });

    await consumeNdjsonStream(
      streamFrom([
        encoder.encode('{"id":1}\n{"id"'),
        encoder.encode(':2}\n\n{"id":3}\n'),
      ]),
      onEvent,
    );

    expect(events).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(onEvent).toHaveBeenCalledTimes(3);
  });

  it("parses the final event when the stream has no trailing newline", async () => {
    const events: Array<{ type: string }> = [];

    await consumeNdjsonStream(
      streamFrom([encoder.encode('{"type":"done"}')]),
      (event: { type: string }) => {
        events.push(event);
      },
    );

    expect(events).toEqual([{ type: "done" }]);
  });

  it("flushes a multi-byte character split at the end of a chunk", async () => {
    const payload = encoder.encode('{"message":"Thanks ★"}');
    const splitAt = payload.length - 2;
    const events: Array<{ message: string }> = [];

    await consumeNdjsonStream(
      streamFrom([payload.slice(0, splitAt), payload.slice(splitAt)]),
      (event: { message: string }) => {
        events.push(event);
      },
    );

    expect(events).toEqual([{ message: "Thanks ★" }]);
  });

  it("reports malformed protocol data distinctly", async () => {
    await expect(
      consumeNdjsonStream(streamFrom([encoder.encode("not-json")]), () => undefined),
    ).rejects.toBeInstanceOf(NdjsonParseError);
  });
});
