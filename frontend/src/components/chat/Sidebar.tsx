import { Plus } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import type { ConversationSummary } from "../../hooks/useConversations";

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, loading }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-900" />)}
        {!loading && conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-neutral-600">No conversations yet</p>
        )}
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeId}
            onSelect={() => onSelect(conversation.id)}
            onDelete={() => onDelete(conversation.id)}
          />
        ))}
      </div>
    </aside>
  );
}
