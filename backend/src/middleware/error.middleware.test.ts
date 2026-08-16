import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "./error.middleware.js";
import { NotFoundError, ValidationError, ExternalServiceError } from "../lib/errors.js";

function buildTestApp() {
  const app = new Hono();
  app.onError(errorMiddleware);
  app.get("/not-found", () => {
    throw new NotFoundError("thing not found");
  });
  app.get("/validation", () => {
    throw new ValidationError("bad input");
  });
  app.get("/external", () => {
    throw new ExternalServiceError("upstream failed");
  });
  app.get("/boom", () => {
    throw new Error("unexpected");
  });
  return app;
}

describe("errorMiddleware", () => {
  it("maps NotFoundError to 404", async () => {
    const res = await buildTestApp().request("/not-found");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "thing not found" });
  });

  it("maps ValidationError to 400", async () => {
    const res = await buildTestApp().request("/validation");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad input" });
  });

  it("maps ExternalServiceError to 502", async () => {
    const res = await buildTestApp().request("/external");
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "upstream failed" });
  });

  it("maps unrecognized errors to 500 without leaking the message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await buildTestApp().request("/boom");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    spy.mockRestore();
  });
});
