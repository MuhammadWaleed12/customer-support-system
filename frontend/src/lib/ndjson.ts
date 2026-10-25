export class NdjsonParseError extends Error {
  constructor(options?: ErrorOptions) {
    super("Invalid NDJSON event", options);
    this.name = "NdjsonParseError";
  }
}

export async function consumeNdjsonStream<T>(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: T) => void | Promise<void>,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const consumeLine = async (line: string) => {
    if (!line.trim()) return;

    let event: T;
    try {
      event = JSON.parse(line) as T;
    } catch (error) {
      throw new NdjsonParseError({ cause: error });
    }

    await onEvent(event);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        await consumeLine(line);
      }
    }

    buffer += decoder.decode();
    await consumeLine(buffer);
  } finally {
    reader.releaseLock();
  }
}
