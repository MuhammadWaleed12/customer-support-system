import { AGENT_ICONS, AGENT_BADGE_CLASSES } from "../../lib/agent-theme";

interface AgentBadgeProps {
  agentType: string;
  label?: string;
}

export function AgentBadge({ agentType, label }: AgentBadgeProps) {
  const Icon = AGENT_ICONS[agentType] ?? AGENT_ICONS.fallback!;
  const classes = AGENT_BADGE_CLASSES[agentType] ?? AGENT_BADGE_CLASSES.fallback!;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {label ?? agentType}
    </span>
  );
}
