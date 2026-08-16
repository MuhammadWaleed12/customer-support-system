import type { Env } from "hono";
import { createFactory } from "hono/factory";
import { AGENT_REGISTRY, isAgentType } from "../agents/registry.js";
import { NotFoundError } from "../lib/errors.js";

const factory = createFactory();
const capabilitiesFactory = createFactory<Env, "/:type/capabilities">();

export const listAgents = factory.createHandlers(async (c) => {
  return c.json(AGENT_REGISTRY);
});

export const getCapabilities = capabilitiesFactory.createHandlers(async (c) => {
  const type = c.req.param("type");

  if (!isAgentType(type)) {
    throw new NotFoundError(`No agent of type "${type}"`);
  }

  const agent = AGENT_REGISTRY.find((entry) => entry.type === type);

  if (!agent) {
    throw new NotFoundError(`No agent of type "${type}"`);
  }

  return c.json(agent);
});
