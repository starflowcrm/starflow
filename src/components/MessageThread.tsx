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

// Detect locked media messages — format: "[Locked Media - X ⭐] caption"
function parseLockedMedia(text: string): { stars: number; caption: string; unlocked: boolean } | null {
  // Unlocked: "[Paid Media - X ⭐] caption" (Telegram renames it after payment)
  const unlockedMatch = text.match(/^\[Paid Media\s*[–-]\s*(\d+)\s*[⭐★]\]/i);
  if (unlockedMatch) {
    return { stars: parseInt(unlockedMatch[1]), caption: text.replace(/^\[Paid Media\s*[–-]\s*\d+\s*[⭐★]\]\s*/, "").trim(), unlocked: true };
  }
  // Locked: "[Locked Media - X ⭐] caption"
  const lockedMatch = text.match(/^\[Locked Media\s*[–-]\s*(\d+)\s*[⭐★]\]/i);
  if (lockedMatch) {
    return { stars: parseInt(lockedMatch[1]), caption: text.replace(/^\[Locked Media\s*[–-]\s*\d+\s*[⭐★]\]\s*/, "").trim(), unlocked: false };
  }
  return null;
}

function LockedMediaBubble({ locked, isOutgoing, timestamp }: { locked: NonNullable<ReturnType<typeof parseLockedMedia>>; isOutgoing: boolean; timestamp: string }) {
  return (
    <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isOutgoing ? "bg-blue-600 rounded-br-md" : "bg-[#2a2a2a] rounded-bl-md"}`}>
      {/* Image placeholder area */}
      <div className="relative w-64 h-40 bg-black/40 flex items-center justify-center">
        {/* Blurred placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-80" />
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
        {/* Unlocked badge */}
        {locked.unlocked && (
          <div className="absolute top-2 right-2 z-20 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>✓</span>
            <span>Unlocked • {locked.stars}⭐</span>
          </div>
        )}
        {/* Locked badge */}
        {!locked.unlocked && (
          <div className="absolute top-2 right-2 z-20 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span>🔒</span>
            <span>{locked.stars}⭐ to unlock</span>
          </div>
        )}
      </div>
      {/* Caption area */}
      <div className="px-3 py-2">
        <div className="text-sm font-medium text-white">
          {locked.unlocked ? `[Paid Media • ${locked.stars} ⭐]` : `[Locked Media • ${locked.stars} ⭐]`}
          {locked.caption && <span className="font-normal ml-1 text-white/80">{locked.caption}</span>}
        </div>
        <div className={`text-[10px] mt-1 ${isOutgoing ? "text-blue-200" : "text-muted-foreground"}`}>
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
          <div className="text-center text-muted-foreground py-12 text-sm">
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.is_outgoing
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-[#2a2a2a] text-white rounded-bl-md"
                  }`}
                >
                  {!msg.is_outgoing && (
                    <div className="text-[11px] text-blue-400 font-medium mb-0.5">
                      {msg.sender_name || peerName}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      msg.is_outgoing ? "text-blue-200" : "text-muted-foreground"
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
