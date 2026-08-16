import { AGENT_ICONS } from "../../lib/agent-theme";

interface TypingIndicatorProps {
  agentType?: string;
  label: string;
}

export function TypingIndicator({ agentType, label }: TypingIndicatorProps) {
  const Icon = agentType ? AGENT_ICONS[agentType] : undefined;

  return (
    <div className="flex items-center gap-2 px-1 text-sm text-neutral-400">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="flex items-center gap-1.5">
        {label}
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500" />
        </span>
      </span>
    </div>
  );
}
