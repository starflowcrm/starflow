"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReplyBox({
  onSend,
  disabled,
}: {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || sending) return;

    setSending(true);
    try {
      await onSend(msg);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-transparent"
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled || sending}
        className="flex-1 bg-[#1a1a1a] border-white/10"
      />
      <Button
        type="submit"
        disabled={!text.trim() || sending || disabled}
        className="bg-blue-600 hover:bg-blue-700 px-6"
      >
        {sending ? "..." : "Send"}
      </Button>
    </form>
  );
}
