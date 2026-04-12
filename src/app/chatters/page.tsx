"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAuthData, chattersApi, accountsApi, clearAuth } from "@/lib/api";

interface ChatterAccount {
  id: number;
  phone: string;
  display_name: string | null;
}

interface Chatter {
  id: number;
  name: string;
  email: string;
  assigned_accounts: ChatterAccount[];
}

interface Account {
  id: number;
  phone: string;
  display_name: string | null;
}

export default function ChattersPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [assignChatter, setAssignChatter] = useState<Chatter | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) { router.replace("/login"); return; }
    if (authData.role !== "agency") { router.replace("/inbox"); return; }
    setAuth(authData);
  }, [router]);

  useEffect(() => {
    if (!auth) return;
    loadData();
  }, [auth]);

  const loadData = async () => {
    try {
      const [chattersData, accountsData] = await Promise.all([
        chattersApi.list(),
        accountsApi.list(),
      ]);
      setChatters(chattersData);
      setAccounts(accountsData);
    } catch {} finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(""); setCreating(true);
    try {
      await chattersApi.create({ name: newName, email: newEmail, password: newPassword });
      setCreateOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword("");
      await loadData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create chatter");
    } finally { setCreating(false); }
  };

  const handleAssign = async () => {
    if (!assignChatter) return;
    setAssigning(true);
    try {
      await chattersApi.assign(assignChatter.id, selectedAccountIds);
      setAssignChatter(null);
      await loadData();
    } catch {} finally { setAssigning(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await chattersApi.delete(id);
      setChatters((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const toggleAccountSelection = (accountId: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative overflow-hidden">
        <div className="blob blob-1 w-72 h-72 bg-blue-500 top-20 -left-20" />
        <div className="blob blob-2 w-96 h-96 bg-indigo-500 -top-10 right-10" />
        <div className="animate-pulse text-slate-400 dark:text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="blob blob-1 w-72 h-72 bg-blue-500 top-20 -left-20" />
      <div className="blob blob-2 w-96 h-96 bg-indigo-500 -top-10 right-10" />
      <div className="blob blob-3 w-64 h-64 bg-violet-500 bottom-10 left-1/3" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 shadow-sm dark:shadow-none sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Starflow</span>
          <nav className="flex items-center gap-1">
            <Link href="/inbox"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Inbox</Button></Link>
            <Link href="/accounts"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Accounts</Button></Link>
            <Link href="/chatters"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-900 dark:text-white bg-black/5 dark:bg-white/10">Chatters</Button></Link>
            <Link href="/billing"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Billing</Button></Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-all text-slate-700 dark:text-white/70" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60" onClick={() => { clearAuth(); router.push("/login"); }}>Logout</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Chatters</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25">Add Chatter</Button>
            </DialogTrigger>
            <DialogContent className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Add New Chatter</DialogTitle>
              </DialogHeader>
              {createError && <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">{createError}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-white/70">Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-white/70">Email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-white/70">Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" disabled={creating}>
                  {creating ? "Creating..." : "Create Chatter"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assign accounts dialog */}
        <Dialog open={!!assignChatter} onOpenChange={(open) => { if (!open) setAssignChatter(null); }}>
          <DialogContent className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Assign Accounts to {assignChatter?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <button key={acc.id} onClick={() => toggleAccountSelection(acc.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedAccountIds.includes(acc.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-600/20"
                      : "border-slate-200/70 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/5"
                  }`}>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.display_name || acc.phone}</div>
                  <div className="text-xs text-slate-400 dark:text-white/40">{acc.phone}</div>
                </button>
              ))}
              {accounts.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-white/40 text-center py-4">No accounts available. Connect a Telegram account first.</p>
              )}
            </div>
            <Button onClick={handleAssign} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" disabled={assigning}>
              {assigning ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {chatters.length === 0 ? (
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-8 text-center text-slate-400 dark:text-white/40">
              No chatters added yet
            </div>
          ) : (
            chatters.map((chatter) => (
              <div key={chatter.id} className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-4 transition-all hover:border-blue-300/50 dark:hover:border-white/20 shadow-lg dark:shadow-none">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{chatter.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"
                      className="border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
                      onClick={() => { setAssignChatter(chatter); setSelectedAccountIds(chatter.assigned_accounts.map((a) => a.id)); }}>
                      Manage Accounts
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 dark:text-red-400 hover:text-red-400" onClick={() => handleDelete(chatter.id)}>Remove</Button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-white/50 mb-2">{chatter.email}</div>
                <div className="flex gap-2 flex-wrap">
                  {chatter.assigned_accounts.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-white/40">No accounts assigned</span>
                  ) : (
                    chatter.assigned_accounts.map((acc) => (
                      <Badge key={acc.id} variant="secondary" className="bg-blue-50 dark:bg-white/5 text-blue-700 dark:text-white/70 border-0">
                        {acc.display_name || acc.phone}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
