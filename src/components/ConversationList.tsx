"use client";

import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Conversation {
  id: number;
  telegram_account_id: number;
  peer_id: number;
  peer_name: string;
  peer_username: string | null;
  last_message_at: string | null;
  assigned_chatter_id: number | null;
  status: string;
  unread_count: number;
}

export interface AccountInfo {
  id: number;
  phone: string;
  display_name: string | null;
  username: string | null;
}

const ACCOUNT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

function getAccountColor(id: number) {
  return ACCOUNT_COLORS[id % ACCOUNT_COLORS.length];
}

function getInitials(name: string | null, fallback: string): string {
  const str = name || fallback;
  return str
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* Account Switcher */
export function AccountSwitcher({
  accounts,
  selectedAccountId,
  onSelect,
  conversationCounts,
}: {
  accounts: AccountInfo[];
  selectedAccountId: number | null;
  onSelect: (id: number) => void;
  conversationCounts: Map<number, { total: number; unread: number }>;
}) {
  if (accounts.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-white/40">
        No accounts connected
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {accounts.map((acc) => {
        const isActive = selectedAccountId === acc.id;
        const color = getAccountColor(acc.id);
        const initials = getInitials(acc.display_name, acc.phone);
        const counts = conversationCounts.get(acc.id);
        const unread = counts?.unread ?? 0;

        return (
          <button
            key={acc.id}
            onClick={() => onSelect(acc.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive
                ? "bg-black/5 dark:bg-white/10"
                : "hover:bg-black/[0.03] dark:hover:bg-white/5"
            }`}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative"
              style={{ backgroundColor: color }}
            >
              {initials}
              {isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full" />
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className={`text-sm font-medium truncate ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-white/70"}`}>
                {acc.display_name || acc.phone}
              </div>
              {(acc.username || acc.phone) && (
                <div className="text-[11px] text-slate-400 dark:text-white/40 truncate">
                  {acc.username ? `@${acc.username}` : acc.phone}
                </div>
              )}
            </div>

            {unread > 0 && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                {unread}
              </span>
            )}

            <Link
              href={`/accounts/${acc.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-slate-300 dark:text-white/30 hover:text-slate-500 dark:hover:text-white/70 flex-shrink-0 text-sm"
              title="Account settings"
            >
              &#9881;&#65039;
            </Link>
          </button>
        );
      })}
    </div>
  );
}

/* Conversation List */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (conv: Conversation) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-0.5 p-2">
        {conversations.length === 0 && (
          <div className="text-center text-slate-400 dark:text-white/40 py-8 text-sm">
            No conversations yet
          </div>
        )}
        {conversations.map((conv) => {
          const isSelected = selectedId === conv.id;
          const initials = getInitials(conv.peer_name, "?");

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isSelected
                  ? "bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/20 dark:border-blue-500/20"
                  : "hover:bg-black/[0.03] dark:hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/60 text-sm font-medium flex-shrink-0">
                {initials}
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-white/90"}`}>
                    {conv.peer_name || "Unknown"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-white/40 flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  {conv.peer_username ? (
                    <span className="text-xs text-slate-400 dark:text-white/40 truncate">
                      @{conv.peer_username}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-white/40 truncate">
                      &nbsp;
                    </span>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
