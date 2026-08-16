import { GitBranch, LifeBuoy, Package, Receipt, HelpCircle, type LucideIcon } from "lucide-react";

export const AGENT_ICONS: Record<string, LucideIcon> = {
  router: GitBranch,
  support: LifeBuoy,
  order: Package,
  billing: Receipt,
  fallback: HelpCircle,
};

export const AGENT_BADGE_CLASSES: Record<string, string> = {
  router: "bg-agent-router/15 text-agent-router border-agent-router/30",
  support: "bg-agent-support/15 text-agent-support border-agent-support/30",
  order: "bg-agent-order/15 text-agent-order border-agent-order/30",
  billing: "bg-agent-billing/15 text-agent-billing border-agent-billing/30",
  fallback: "bg-agent-fallback/15 text-agent-fallback border-agent-fallback/30",
};
