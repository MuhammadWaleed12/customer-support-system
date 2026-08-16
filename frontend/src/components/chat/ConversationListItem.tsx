import { Trash2 } from "lucide-react";
import type { ConversationSummary } from "../../hooks/useConversations";

interface ConversationListItemProps {
  conversation: ConversationSummary;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConversationListItem({
  conversation,
  active,
  onSelect,
  onDelete,
}: ConversationListItemProps) {
  return (
    <div
      className={`group flex items-center justify-between rounded-lg px-2 py-2 text-sm ${
        active
          ? "bg-neutral-800 text-neutral-100"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex-1 truncate text-left">
        {conversation.title || "New conversation"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="ml-1 hidden rounded p-1 text-neutral-500 hover:text-red-400 group-hover:block"
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
