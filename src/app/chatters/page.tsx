"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Create chatter
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Assign accounts
  const [assignChatter, setAssignChatter] = useState<Chatter | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) {
      router.replace("/login");
      return;
    }
    if (authData.role !== "agency") {
      router.replace("/inbox");
      return;
    }
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await chattersApi.create({
        name: newName,
        email: newEmail,
        password: newPassword,
      });
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      await loadData();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create chatter"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!assignChatter) return;
    setAssigning(true);
    try {
      await chattersApi.assign(assignChatter.id, selectedAccountIds);
      setAssignChatter(null);
      await loadData();
    } catch {
      // ignore
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await chattersApi.delete(id);
      setChatters((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Starflow
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/inbox">
              <Button variant="ghost" size="sm">
                Inbox
              </Button>
            </Link>
            <Link href="/accounts">
              <Button variant="ghost" size="sm">
                Accounts
              </Button>
            </Link>
            <Link href="/chatters">
              <Button variant="ghost" size="sm" className="text-white">
                Chatters
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="ghost" size="sm">
                Billing
              </Button>
            </Link>
          </nav>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearAuth();
            router.push("/login");
          }}
        >
          Logout
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Chatters</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Add Chatter
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-white/10">
              <DialogHeader>
                <DialogTitle>Add New Chatter</DialogTitle>
              </DialogHeader>
              {createError && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                  {createError}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="bg-[#0f0f0f] border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="bg-[#0f0f0f] border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-[#0f0f0f] border-white/10"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Chatter"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assign accounts dialog */}
        <Dialog
          open={!!assignChatter}
          onOpenChange={(open) => {
            if (!open) setAssignChatter(null);
          }}
        >
          <DialogContent className="bg-[#1a1a1a] border-white/10">
            <DialogHeader>
              <DialogTitle>
                Assign Accounts to {assignChatter?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => toggleAccountSelection(acc.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAccountIds.includes(acc.id)
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {acc.display_name || acc.phone}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {acc.phone}
                  </div>
                </button>
              ))}
              {accounts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No accounts available. Connect a Telegram account first.
                </p>
              )}
            </div>
            <Button
              onClick={handleAssign}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={assigning}
            >
              {assigning ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          {chatters.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardContent className="py-8 text-center text-muted-foreground">
                No chatters added yet
              </CardContent>
            </Card>
          ) : (
            chatters.map((chatter) => (
              <Card key={chatter.id} className="bg-[#1a1a1a] border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{chatter.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10"
                        onClick={() => {
                          setAssignChatter(chatter);
                          setSelectedAccountIds(
                            chatter.assigned_accounts.map((a) => a.id)
                          );
                        }}
                      >
                        Manage Accounts
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(chatter.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    {chatter.email}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {chatter.assigned_accounts.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No accounts assigned
                      </span>
                    ) : (
                      chatter.assigned_accounts.map((acc) => (
                        <Badge
                          key={acc.id}
                          variant="secondary"
                          className="bg-white/5"
                        >
                          {acc.display_name || acc.phone}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
