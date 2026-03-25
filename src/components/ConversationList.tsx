"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountBadge } from "./AccountBadge";

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

interface AccountInfo {
  id: number;
  phone: string;
  display_name: string | null;
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

export function ConversationList({
  conversations,
  accounts,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  accounts: AccountInfo[];
  selectedId: number | null;
  onSelect: (conv: Conversation) => void;
}) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0.5 p-2">
        {conversations.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No conversations yet
          </div>
        )}
        {conversations.map((conv) => {
          const account = accountMap.get(conv.telegram_account_id);
          const isSelected = selectedId === conv.id;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isSelected
                  ? "bg-blue-600/20 border border-blue-500/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {conv.peer_name || "Unknown"}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <AccountBadge
                    accountId={conv.telegram_account_id}
                    label={account?.display_name || account?.phone}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
