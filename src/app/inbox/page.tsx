"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ConversationList,
  type Conversation,
} from "@/components/ConversationList";
import { MessageThread, type Message } from "@/components/MessageThread";
import { ReplyBox } from "@/components/ReplyBox";
import { SendLockedModal } from "@/components/SendLockedModal";
import {
  getAuthData,
  clearAuth,
  conversationsApi,
  messagesApi,
  accountsApi,
} from "@/lib/api";
import { starflowWS } from "@/lib/ws";

export default function InboxPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [accounts, setAccounts] = useState<
    { id: number; phone: string; display_name: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) {
      router.replace("/login");
      return;
    }
    setAuth(authData);
  }, [router]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationsApi.list();
      setConversations(data);
    } catch {
      // ignore
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await accountsApi.list();
      setAccounts(data);
    } catch {
      // chatters might not have access
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    Promise.all([loadConversations(), loadAccounts()]).finally(() =>
      setLoading(false)
    );
  }, [auth, loadConversations, loadAccounts]);

  // WebSocket
  useEffect(() => {
    if (!auth?.token) return;
    starflowWS.connect(auth.token);

    const unsubMsg = starflowWS.on(
      "new_message",
      (data: Record<string, unknown>) => {
        const msg = data.message as Message;
        const convId = data.conversation_id as number;

        setMessages((prev) => {
          if (prev.length > 0 && prev[0]?.conversation_id === convId) {
            // Deduplicate by telegram_message_id
            if (
              msg.telegram_message_id &&
              prev.some(
                (m) => m.telegram_message_id === msg.telegram_message_id
              )
            ) {
              return prev;
            }
            return [...prev, msg];
          }
          return prev;
        });

        // Update conversation list
        loadConversations();
      }
    );

    const unsubConv = starflowWS.on("conversation_updated", () => {
      loadConversations();
    });

    return () => {
      unsubMsg();
      unsubConv();
      starflowWS.disconnect();
    };
  }, [auth, loadConversations]);

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const msgs = await conversationsApi.getMessages(conv.id);
      setMessages(msgs);
      // Reset unread in local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      // ignore
    }
  };

  const handleSend = async (text: string) => {
    if (!selectedConv) return;
    const msg = await messagesApi.send(selectedConv.id, text);
    setMessages((prev) => [...prev, msg]);
  };

  const handleLogout = () => {
    clearAuth();
    starflowWS.disconnect();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading inbox...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Starflow
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/inbox">
              <Button variant="ghost" size="sm" className="text-white">
                Inbox
              </Button>
            </Link>
            {auth?.role === "agency" && (
              <>
                <Link href="/accounts">
                  <Button variant="ghost" size="sm">
                    Accounts
                  </Button>
                </Link>
                <Link href="/chatters">
                  <Button variant="ghost" size="sm">
                    Chatters
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{auth?.name}</span>
          <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
            {auth?.role}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r border-white/10 bg-[#0f0f0f] flex flex-col">
          <div className="p-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Conversations
            </h2>
          </div>
          <ConversationList
            conversations={conversations}
            accounts={accounts}
            selectedId={selectedConv?.id ?? null}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col bg-[#111111]">
          {selectedConv ? (
            <>
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">
                    {selectedConv.peer_name}
                  </div>
                  {selectedConv.peer_username && (
                    <div className="text-xs text-muted-foreground">
                      @{selectedConv.peer_username}
                    </div>
                  )}
                </div>
              </div>
              <MessageThread
                messages={messages}
                peerName={selectedConv.peer_name}
              />
              <div className="flex items-center gap-0 bg-[#0f0f0f]">
                <div className="flex-1">
                  <ReplyBox onSend={handleSend} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 whitespace-nowrap"
                  onClick={() => setLockedModalOpen(true)}
                >
                  Send Locked
                </Button>
              </div>
              <SendLockedModal
                open={lockedModalOpen}
                onOpenChange={setLockedModalOpen}
                conversationId={selectedConv.id}
                onSent={(msg) => {
                  setMessages((prev) => [...prev, msg]);
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
