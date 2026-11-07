import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth.controller.js";
import { MAX_MESSAGE_LENGTH, sendMessageSchema } from "./chat.controller.js";

describe("public API input limits", () => {
  it("normalizes valid login emails and bounds credentials", () => {
    expect(
      loginSchema.parse({ email: "  alice@example.com  ", password: "password123" }),
    ).toEqual({ email: "alice@example.com", password: "password123" });

    expect(
      loginSchema.safeParse({ email: `${"a".repeat(310)}@example.com`, password: "password123" })
        .success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: "alice@example.com", password: "x".repeat(1025) }).success)
      .toBe(false);
  });

  it("rejects blank and oversized chat messages after trimming", () => {
    expect(sendMessageSchema.safeParse({ content: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: "x".repeat(MAX_MESSAGE_LENGTH + 1) }).success)
      .toBe(false);
    expect(sendMessageSchema.parse({ content: "  Where is my order?  " }).content).toBe(
      "Where is my order?",
    );
  });
});
