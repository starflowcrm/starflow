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

  useEffect(() => {
    if (tab === "vault" && open && vaultItems.length === 0) {
      setVaultLoading(true);
      const token = getAuthData()?.token;
      const vaultUrl = conversationAccountId ? `${API_BASE}/vault/?account_id=${conversationAccountId}` : `${API_BASE}/vault/`;
      fetch(vaultUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.json())
        .then(data => {
          // Backend returns { items, folders }; tolerate old array shape just in case.
          if (Array.isArray(data)) setVaultItems(data);
          else setVaultItems(Array.isArray(data?.items) ? data.items : []);
        })
        .catch(() => {})
        .finally(() => setVaultLoading(false));
    }
  }, [tab, open, vaultItems.length, conversationAccountId]);

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
      <DialogContent className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Send Locked Media</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
          <button onClick={() => setTab("upload")}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "upload" ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"}`}>
            Upload New
          </button>
          <button onClick={() => setTab("vault")}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === "vault" ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"}`}>
            From Vault
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">{error}</div>}

          {tab === "upload" ? (
            <div className="space-y-2">
              <Label className="text-xs text-slate-600 dark:text-white/60">Photo or Video</Label>
              <Input ref={fileRef} type="file" accept="image/*,video/*"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
              {file && <p className="text-xs text-slate-400 dark:text-white/40">{file.name} ({mediaType}) — {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-slate-600 dark:text-white/60">Select from Vault</Label>
              {vaultLoading ? (
                <p className="text-xs text-slate-400 dark:text-white/40 py-4 text-center">Loading vault...</p>
              ) : vaultItems.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-white/40 py-4 text-center">
                  Vault is empty. {conversationAccountId ? <a href={`/accounts/${conversationAccountId}/vault`} className="text-blue-500 dark:text-blue-400 underline">Upload items</a> : "Upload items"} first.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {vaultItems.map(item => (
                    <button key={item.id} type="button"
                      onClick={() => { setSelectedVaultItem(item); setStarCount(String(item.default_star_price)); }}
                      className={`bg-white/50 dark:bg-white/5 border rounded-lg p-2 text-center transition-all ${selectedVaultItem?.id === item.id ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30"}`}>
                      <div className="text-2xl">{item.media_type === "video" ? "🎬" : "📷"}</div>
                      <p className="text-[9px] text-slate-500 dark:text-white/60 truncate mt-1">{item.name}</p>
                      <p className="text-[9px] text-yellow-600 dark:text-yellow-400">{item.default_star_price}⭐</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-white/60">Star Price</Label>
            <Input type="number" min={1} max={10000} value={starCount}
              onChange={e => setStarCount(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-white/60">Caption (optional)</Label>
            <Input value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Exclusive content..." className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
            disabled={(tab === "upload" ? !file : !selectedVaultItem) || sending}>
            {sending ? "Sending..." : `🔒 Send for ${starCount} ⭐`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
