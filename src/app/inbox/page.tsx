"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AccountSwitcher,
  ConversationList,
  type Conversation,
  type AccountInfo,
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);

  useEffect(() => setMounted(true), []);

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
      if (data.length > 0) {
        setSelectedAccountId((prev) => prev ?? data[0].id);
      }
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

        loadConversations();
      }
    );

    const unsubConv = starflowWS.on("conversation_updated", () => {
      loadConversations();
    });

    const unsubUpdate = starflowWS.on("message_updated", (data: Record<string, unknown>) => {
      const msg = data.message as Message;
      const convId = data.conversation_id as number;
      setMessages((prev) => {
        if (prev.length > 0 && prev[0]?.conversation_id === convId) {
          return prev.map((m) => m.id === msg.id ? { ...m, text: msg.text } : m);
        }
        return prev;
      });
    });

    return () => {
      unsubMsg();
      unsubConv();
      unsubUpdate();
      starflowWS.disconnect();
    };
  }, [auth, loadConversations]);

  const filteredConversations = useMemo(() => {
    if (!selectedAccountId) return conversations;
    return conversations.filter(
      (c) => c.telegram_account_id === selectedAccountId
    );
  }, [conversations, selectedAccountId]);

  const conversationCounts = useMemo(() => {
    const map = new Map<number, { total: number; unread: number }>();
    for (const c of conversations) {
      const existing = map.get(c.telegram_account_id) || { total: 0, unread: 0 };
      existing.total += 1;
      existing.unread += c.unread_count;
      map.set(c.telegram_account_id, existing);
    }
    return map;
  }, [conversations]);

  const selectedAccount = useMemo(() => {
    if (!selectedConv) return null;
    return accounts.find((a) => a.id === selectedConv.telegram_account_id) ?? null;
  }, [selectedConv, accounts]);

  const handleSelectAccount = (accountId: number) => {
    setSelectedAccountId(accountId);
    if (selectedConv && selectedConv.telegram_account_id !== accountId) {
      setSelectedConv(null);
      setMessages([]);
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const msgs = await conversationsApi.getMessages(conv.id);
      setMessages(msgs);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="animate-pulse text-slate-400 dark:text-white/40">
          Loading inbox...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      {/* Top bar - glass */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Starflow
          </span>
          <nav className="flex items-center gap-1">
            <Link href="/inbox">
              <Button variant="ghost" size="sm" className="text-slate-900 dark:text-white text-xs h-8 bg-black/5 dark:bg-white/10">
                Inbox
              </Button>
            </Link>
            {auth?.role === "agency" && (
              <>
                <Link href="/accounts">
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">
                    Accounts
                  </Button>
                </Link>
                <Link href="/chatters">
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">
                    Chatters
                  </Button>
                </Link>
                <Link href="/billing">
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">
                    Billing
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-white/50">{auth?.name}</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
            {auth?.role}
          </span>
          <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - glass */}
        <div className="w-80 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border-r border-slate-200/70 dark:border-white/[0.07] flex flex-col">
          {/* Account switcher */}
          <div className="border-b border-slate-200/50 dark:border-white/[0.06]">
            <div className="px-4 pt-3 pb-1.5">
              <h3 className="text-[10px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                Accounts
              </h3>
            </div>
            <AccountSwitcher
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelect={handleSelectAccount}
              conversationCounts={conversationCounts}
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 pt-3 pb-1.5">
              <h3 className="text-[10px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                Conversations
                {filteredConversations.length > 0 && (
                  <span className="ml-1.5 text-slate-300 dark:text-white/30">
                    {filteredConversations.length}
                  </span>
                )}
              </h3>
            </div>
            <ConversationList
              conversations={filteredConversations}
              selectedId={selectedConv?.id ?? null}
              onSelect={handleSelectConversation}
            />
          </div>
        </div>

        {/* Chat panel - glass */}
        <div className="flex-1 flex flex-col bg-white/30 dark:bg-white/[0.02]">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-slate-200/50 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/60 text-sm font-medium flex-shrink-0">
                  {(selectedConv.peer_name || "?")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {selectedConv.peer_name}
                    </span>
                    {selectedConv.peer_username && (
                      <span className="text-xs text-slate-400 dark:text-white/40">
                        @{selectedConv.peer_username}
                      </span>
                    )}
                  </div>
                  {selectedAccount && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 dark:text-white/40">
                        via
                      </span>
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
                              "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"][
                              selectedAccount.id % 10
                            ],
                        }}
                      />
                      <span className="text-[11px] text-slate-400 dark:text-white/40">
                        {selectedAccount.display_name || selectedAccount.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <MessageThread
                messages={messages}
                peerName={selectedConv.peer_name}
              />

              {/* Reply area */}
              <div className="flex items-center gap-0 bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl border-t border-slate-200/50 dark:border-white/[0.06]">
                <div className="flex-1">
                  <ReplyBox onSend={handleSend} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-3 text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-400/10 whitespace-nowrap text-xs h-8"
                  onClick={() => setLockedModalOpen(true)}
                >
                  Send Locked
                </Button>
              </div>

              <SendLockedModal
                key={lockedModalOpen ? "open" : "closed"}
                open={lockedModalOpen}
                onOpenChange={setLockedModalOpen}
                conversationId={selectedConv.id}
                conversationAccountId={selectedConv.telegram_account_id}
                onSent={(msg) => {
                  setMessages((prev) => [...prev, msg]);
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-2">
              <div className="text-4xl opacity-20">💬</div>
              <div className="text-sm">Select a conversation to start messaging</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
