"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ReplyBox({
  onSend,
  disabled,
}: {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;

    setSending(true);
    setError(null);
    try {
      await onSend(msg);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col gap-1 p-3 bg-transparent">
      {error && (
        <div className="text-xs text-red-400 px-1">{error}</div>
      )}
      <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled || sending}
        className="flex-1 bg-white/50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 focus:ring-1 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 disabled:opacity-50 transition-all"
      />
      <Button
        onClick={send}
        disabled={!text.trim() || sending || disabled}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 shadow-lg shadow-blue-500/20"
      >
        {sending ? "..." : "Send"}
      </Button>
      </div>
    </div>
  );
}
