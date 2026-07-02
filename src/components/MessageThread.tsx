"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Message {
  id: number;
  conversation_id: number;
  telegram_message_id: number | null;
  text: string;
  is_outgoing: boolean;
  sender_name: string;
  timestamp: string;
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseLockedMedia(text: string): { stars: number; caption: string; unlocked: boolean } | null {
  // Matches "[Locked Media - 100 ⭐]", "[Paid Media - 100 ★]" and the legacy
  // "[Locked Media - 100 Stars]" wording.
  const unlockedMatch = text.match(/^\[Paid Media\s*[–-]\s*(\d+)\s*(?:[⭐★]|Stars?)\]/i);
  if (unlockedMatch) {
    return { stars: parseInt(unlockedMatch[1]), caption: text.replace(/^\[Paid Media\s*[–-]\s*\d+\s*(?:[⭐★]|Stars?)\]\s*/i, "").trim(), unlocked: true };
  }
  const lockedMatch = text.match(/^\[Locked Media\s*[–-]\s*(\d+)\s*(?:[⭐★]|Stars?)\]/i);
  if (lockedMatch) {
    return { stars: parseInt(lockedMatch[1]), caption: text.replace(/^\[Locked Media\s*[–-]\s*\d+\s*(?:[⭐★]|Stars?)\]\s*/i, "").trim(), unlocked: false };
  }
  return null;
}

function LockedMediaBubble({ locked, isOutgoing, timestamp }: { locked: NonNullable<ReturnType<typeof parseLockedMedia>>; isOutgoing: boolean; timestamp: string }) {
  return (
    <div className={`max-w-[75%] rounded-2xl overflow-hidden ${
      isOutgoing
        ? "bg-gradient-to-br from-blue-600 to-indigo-600 rounded-br-md shadow-lg shadow-blue-500/20"
        : "bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-bl-md"
    }`}>
      <div className="relative w-64 h-40 bg-black/20 dark:bg-black/40 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/50 to-slate-600/50 dark:from-gray-700 dark:to-gray-900 opacity-80" />
        {locked.unlocked ? (
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="text-3xl">🖼️</span>
            <span className="text-xs text-white/70">Media unlocked in Telegram</span>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="text-3xl">🔒</span>
            <span className="text-xs text-white/70">Locked media</span>
          </div>
        )}
        {locked.unlocked && (
          <div className="absolute top-2 right-2 z-20 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>✓</span>
            <span>Unlocked &bull; {locked.stars}⭐</span>
          </div>
        )}
        {!locked.unlocked && (
          <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>🔒</span>
            <span>{locked.stars}⭐ to unlock</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className={`text-sm font-medium ${isOutgoing ? "text-white" : "text-slate-900 dark:text-white"}`}>
          {locked.unlocked ? `[Paid Media • ${locked.stars} ⭐]` : `[Locked Media • ${locked.stars} ⭐]`}
          {locked.caption && <span className={`font-normal ml-1 ${isOutgoing ? "text-white/80" : "text-slate-600 dark:text-white/80"}`}>{locked.caption}</span>}
        </div>
        <div className={`text-[10px] mt-1 ${isOutgoing ? "text-blue-200" : "text-slate-400 dark:text-white/40"}`}>
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
}

export function MessageThread({
  messages,
  peerName,
}: {
  messages: Message[];
  peerName: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-3 max-w-3xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-white/40 py-12 text-sm">
            No messages in this conversation
          </div>
        )}
        {messages.map((msg) => {
          const locked = parseLockedMedia(msg.text);
          return (
            <div
              key={msg.id}
              className={`flex ${msg.is_outgoing ? "justify-end" : "justify-start"}`}
            >
              {locked ? (
                <LockedMediaBubble locked={locked} isOutgoing={msg.is_outgoing} timestamp={msg.timestamp} />
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 transition-all ${
                    msg.is_outgoing
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-blue-500/20"
                      : "bg-white/70 dark:bg-white/10 backdrop-blur-xl text-slate-900 dark:text-white rounded-bl-md border border-slate-200/50 dark:border-white/10"
                  }`}
                >
                  {!msg.is_outgoing && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                      {msg.sender_name || peerName}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      msg.is_outgoing ? "text-blue-200" : "text-slate-400 dark:text-white/40"
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
