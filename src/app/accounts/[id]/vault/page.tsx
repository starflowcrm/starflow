"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthData, clearAuth } from "@/lib/api";

interface VaultItem {
  id: number;
  name: string;
  media_type: "photo" | "video";
  file_id: string;
  default_star_price: number;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthData()?.token;
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

export default function AccountVaultPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("100");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = getAuthData();
    if (!auth?.token) { router.replace("/login"); return; }
    loadItems();
  }, [router, accountId]);

  async function loadItems() {
    setLoading(true);
    try {
      const r = await authFetch(`/vault/?account_id=${accountId}`);
      if (r.status === 401) { clearAuth(); router.replace("/login"); return; }
      setItems(await r.json());
    } catch { setError("Failed to load vault"); }
    finally { setLoading(false); }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";
      const form = new FormData();
      form.append("file", file);
      form.append("name", name || file.name);
      form.append("media_type", mediaType);
      form.append("default_star_price", price);
      form.append("account_id", String(accountId));

      const r = await authFetch("/vault/", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Upload failed");

      setItems(prev => [data, ...prev]);
      setFile(null); setName(""); setPrice("100");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    try {
      await authFetch(`/vault/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { alert("Delete failed"); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/[0.06] bg-[#0e0e0e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/accounts/${accountId}`} className="text-white/50 hover:text-white text-sm">&larr; Account Dashboard</Link>
          <h1 className="text-lg font-semibold">Content Vault</h1>
        </div>
        <Link href="/accounts">
          <Button variant="ghost" size="sm" className="text-white/50">Accounts</Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold mb-4 text-white/80">Upload to Vault</h2>
            <p className="text-xs text-white/40 mb-4">
              Files are uploaded via Telethon (up to 2GB). Once uploaded, send to any chat instantly.
            </p>
            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs text-white/50">File (photo or video)</Label>
                <Input ref={fileRef} type="file" accept="image/*,video/*"
                  onChange={e => { setFile(e.target.files?.[0] || null); if (!name) setName(e.target.files?.[0]?.name.replace(/\.[^.]+$/, "") || ""); }}
                  className="bg-[#0a0a0a] border-white/10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/50">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pool video"
                  className="bg-[#0a0a0a] border-white/10 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/50">Default star price</Label>
                <Input type="number" min={1} value={price} onChange={e => setPrice(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10 text-sm" />
              </div>
              <div className="sm:col-span-4">
                {uploadError && <p className="text-xs text-red-400 mb-2">{uploadError}</p>}
                <Button type="submit" disabled={!file || uploading} className="bg-blue-600 hover:bg-blue-700 text-sm">
                  {uploading ? "Uploading..." : "Upload to Vault"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading ? (
          <p className="text-white/40 text-sm">Loading vault...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-sm">Vault is empty - upload your first item above</p>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold mb-4 text-white/60">{items.length} item{items.length !== 1 ? "s" : ""}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden group">
                  <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center text-4xl">
                    {item.media_type === "video" ? "🎬" : "📷"}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {item.media_type}
                      </span>
                      <span className="text-[10px] text-yellow-400">{item.default_star_price} star</span>
                    </div>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-[10px] text-red-400/60 hover:text-red-400 mt-1 w-full text-left">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
