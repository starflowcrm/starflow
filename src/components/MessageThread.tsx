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
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_outgoing ? "justify-end" : "justify-start"}`}
          >
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
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
