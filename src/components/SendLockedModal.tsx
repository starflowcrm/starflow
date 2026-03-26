"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { messagesApi } from "@/lib/api";

interface SendLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: number;
  onSent: (message: {
    id: number;
    conversation_id: number;
    telegram_message_id: number | null;
    text: string;
    is_outgoing: boolean;
    sender_name: string;
    timestamp: string;
  }) => void;
}

export function SendLockedModal({
  open,
  onOpenChange,
  conversationId,
  onSent,
}: SendLockedModalProps) {
  const [starCount, setStarCount] = useState("1");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaType: "photo" | "video" | null = file
    ? file.type.startsWith("video/")
      ? "video"
      : "photo"
    : null;

  const reset = () => {
    setStarCount("1");
    setCaption("");
    setFile(null);
    setError("");
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !mediaType) return;

    const stars = parseInt(starCount);
    if (isNaN(stars) || stars < 1 || stars > 10000) {
      setError("Star count must be between 1 and 10000");
      return;
    }

    setSending(true);
    setError("");

    try {
      // Use FormData for file upload (avoids base64 memory issues with large files)
      const formData = new FormData();
      formData.append("conversation_id", String(conversationId));
      formData.append("star_count", String(stars));
      formData.append("media_type", mediaType);
      if (caption) formData.append("caption", caption);
      formData.append("file", file);

      const result = await messagesApi.sendPaidMediaForm(formData);

      onSent(result);
      reset();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      console.error("Send locked media error:", err);
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        reset();
      }}
    >
      <DialogContent className="bg-[#1a1a1a] border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Locked Media</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Photo or Video</Label>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="bg-[#0f0f0f] border-white/10"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({mediaType})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Star Price</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={starCount}
              onChange={(e) => setStarCount(e.target.value)}
              placeholder="1"
              className="bg-[#0f0f0f] border-white/10"
            />
            <p className="text-xs text-muted-foreground">
              Fans pay this many Telegram Stars to unlock
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Caption (optional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Exclusive content..."
              className="bg-[#0f0f0f] border-white/10"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!file || sending}
          >
            {sending ? "Sending..." : `Send Locked ${mediaType || "Media"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
