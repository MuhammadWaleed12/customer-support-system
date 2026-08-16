import { useState } from "react";
import { LogOut } from "lucide-react";
import { LoginForm } from "./components/auth/LoginForm";
import { Sidebar } from "./components/chat/Sidebar";
import { MessageThread } from "./components/chat/MessageThread";
import { ChatInput } from "./components/chat/ChatInput";
import { useAuth } from "./hooks/useAuth";
import { useConversations } from "./hooks/useConversations";
import { useConversation } from "./hooks/useConversation";
import { useStreamMessage } from "./hooks/useStreamMessage";
import { useDeleteConversation } from "./hooks/useDeleteConversation";
import { useToast } from "./hooks/useToast";

function App() {
  const { user, checkingSession, loggingIn, login, logout } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  const { conversations, loading: conversationsLoading, refetch: refetchConversations } =
    useConversations(Boolean(user));
  const { conversation, fetchById: fetchConversationById } = useConversation(activeConversationId);
  const { sendMessage, sending, streaming } = useStreamMessage();
  const { deleteConversation } = useDeleteConversation();
  const { showToast } = useToast();

  async function handleSend(content: string) {
    await sendMessage(
      { conversationId: activeConversationId, content },
      {
        onRouting: async (event) => {
          setActiveConversationId(event.conversationId);
          await Promise.all([fetchConversationById(event.conversationId), refetchConversations()]);
        },
        onDone: async (event) => {
          await Promise.all([fetchConversationById(event.conversationId), refetchConversations()]);
        },
        onError: (message) => showToast(message),
      },
    );
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

  async function handleLogout() {
    await logout();
    setActiveConversationId(undefined);
  }

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  if (!user) {
    return <LoginForm onLogin={login} loading={loggingIn} />;
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">{user.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>
        <MessageThread messages={conversation?.messages ?? []} streaming={streaming} sending={sending} />
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}

export default App;
