"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { messagesApi, getAuthData } from "@/lib/api";

interface VaultItem {
  id: number;
  name: string;
  media_type: "photo" | "video";
  file_id: string;
  default_star_price: number;
}

interface SendLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: number;
  conversationAccountId?: number;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function SendLockedModal({ open, onOpenChange, conversationId, conversationAccountId, onSent }: SendLockedModalProps) {
  const [tab, setTab] = useState<"upload" | "vault">("upload");
  const [starCount, setStarCount] = useState("100");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Vault state
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultItem | null>(null);

  const mediaType: "photo" | "video" | null = file
    ? file.type.startsWith("video/") ? "video" : "photo"
    : null;

  const reset = () => {
    setStarCount("100"); setCaption(""); setFile(null); setError("");
    setSending(false); setSelectedVaultItem(null); setTab("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Load vault items when switching to vault tab
  useEffect(() => {
    if (tab === "vault" && open && vaultItems.length === 0) {
      setVaultLoading(true);
      const token = getAuthData()?.token;
      const vaultUrl = conversationAccountId ? `${API_BASE}/vault/?account_id=${conversationAccountId}` : `${API_BASE}/vault/`;
      fetch(vaultUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.json())
        .then(data => { setVaultItems(Array.isArray(data) ? data : []); })
        .catch(() => {})
        .finally(() => setVaultLoading(false));
    }
  }, [tab, open, vaultItems.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stars = parseInt(starCount);
    if (isNaN(stars) || stars < 1 || stars > 10000) {
      setError("Star count must be between 1 and 10,000"); return;
    }

    if (tab === "upload" && !file) return;
    if (tab === "vault" && !selectedVaultItem) { setError("Select an item from the vault"); return; }

    setSending(true); setError("");

    try {
      const formData = new FormData();
      formData.append("conversation_id", String(conversationId));
      formData.append("star_count", String(stars));
      if (caption) formData.append("caption", caption);

      if (tab === "vault" && selectedVaultItem) {
        formData.append("vault_item_id", String(selectedVaultItem.id));
        formData.append("media_type", selectedVaultItem.media_type);
      } else if (file && mediaType) {
        formData.append("media_type", mediaType);
        formData.append("file", file);
      }

      const result = await messagesApi.sendPaidMediaForm(formData);
      onSent(result);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); reset(); }}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Locked Media</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#0f0f0f] p-1 rounded-lg">
          <button onClick={() => setTab("upload")}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "upload" ? "bg-[#1a1a1a] text-white" : "text-white/40 hover:text-white/70"}`}>
            Upload New
          </button>
          <button onClick={() => setTab("vault")}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "vault" ? "bg-[#1a1a1a] text-white" : "text-white/40 hover:text-white/70"}`}>
            From Vault
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">{error}</div>}

          {tab === "upload" ? (
            <div className="space-y-2">
              <Label className="text-xs">Photo or Video</Label>
              <Input ref={fileRef} type="file" accept="image/*,video/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="bg-[#0f0f0f] border-white/10" />
              {file && <p className="text-xs text-white/40">{file.name} ({mediaType}) — {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Select from Vault</Label>
              {vaultLoading ? (
                <p className="text-xs text-white/40 py-4 text-center">Loading vault...</p>
              ) : vaultItems.length === 0 ? (
                <p className="text-xs text-white/40 py-4 text-center">
                  Vault is empty. <a href="/vault" className="text-blue-400 underline">Upload items</a> first.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {vaultItems.map(item => (
                    <button key={item.id} type="button"
                      onClick={() => { setSelectedVaultItem(item); setStarCount(String(item.default_star_price)); }}
                      className={`bg-[#0f0f0f] border rounded-lg p-2 text-center transition-all ${selectedVaultItem?.id === item.id ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/30"}`}>
                      <div className="text-2xl">{item.media_type === "video" ? "🎬" : "📷"}</div>
                      <p className="text-[9px] text-white/60 truncate mt-1">{item.name}</p>
                      <p className="text-[9px] text-yellow-400">{item.default_star_price}⭐</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Star Price</Label>
            <Input type="number" min={1} max={10000} value={starCount}
              onChange={e => setStarCount(e.target.value)}
              className="bg-[#0f0f0f] border-white/10" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Caption (optional)</Label>
            <Input value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Exclusive content..." className="bg-[#0f0f0f] border-white/10" />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={(tab === "upload" ? !file : !selectedVaultItem) || sending}>
            {sending ? "Sending..." : `🔒 Send for ${starCount} ⭐`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
