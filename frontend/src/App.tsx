import { useEffect, useState } from "react";
import { Sidebar } from "./components/chat/Sidebar";
import { MessageThread } from "./components/chat/MessageThread";
import { ChatInput } from "./components/chat/ChatInput";
import { UserSwitcher } from "./components/layout/UserSwitcher";
import { useUsers } from "./hooks/useUsers";
import { useConversations } from "./hooks/useConversations";
import { useConversation } from "./hooks/useConversation";
import { useSendMessage } from "./hooks/useSendMessage";
import { useDeleteConversation } from "./hooks/useDeleteConversation";
import { useToast } from "./hooks/useToast";

function App() {
  const { users } = useUsers();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId && users.length > 0) setUserId(users[0]!.id);
  }, [users, userId]);

  const { conversations, loading: conversationsLoading, refetch: refetchConversations } =
    useConversations(userId);
  const { conversation, refetch: refetchConversation } = useConversation(activeConversationId);
  const { sendMessage, sending } = useSendMessage();
  const { deleteConversation } = useDeleteConversation();
  const { showToast } = useToast();

  async function handleSend(content: string) {
    if (!userId) return;

    const outcome = await sendMessage({ userId, conversationId: activeConversationId, content });

    if (!outcome.ok) {
      showToast(outcome.error);
      return;
    }

    setActiveConversationId(outcome.data.conversationId);
    await Promise.all([refetchConversation(), refetchConversations()]);
  }

  async function handleDelete(id: string) {
    const ok = await deleteConversation(id);
    if (!ok) {
      showToast("Failed to delete conversation");
      return;
    }
    showToast("Conversation deleted");
    if (id === activeConversationId) setActiveConversationId(undefined);
    await refetchConversations();
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={() => setActiveConversationId(undefined)}
        onDelete={handleDelete}
        loading={conversationsLoading}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5">
          <h1 className="text-sm font-medium text-neutral-200">Support Desk AI</h1>
          <UserSwitcher users={users} selectedUserId={userId} onChange={setUserId} />
        </header>
        <MessageThread messages={conversation?.messages ?? []} sending={sending} />
        <ChatInput onSend={handleSend} disabled={sending || !userId} />
      </div>
    </div>
  );
}

export default App;
