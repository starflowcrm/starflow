"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuthData, accountsApi, clearAuth } from "@/lib/api";
import { starflowWS } from "@/lib/ws";

interface Account {
  id: number;
  phone: string;
  display_name: string | null;
  username: string | null;
  is_active: boolean;
  created_at: string | null;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
}

export default function AccountsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"qr" | "phone">("qr");

  const [qrUrl, setQrUrl] = useState("");
  const [qrAuthToken, setQrAuthToken] = useState("");
  const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "pending" | "success" | "expired" | "needs_password">("idle");
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [twoFaSubmitting, setTwoFaSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const qrRefreshTimer = useRef<NodeJS.Timeout | null>(null);
  const qrPollTimer = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) { router.replace("/login"); return; }
    if (authData.role !== "agency") { router.replace("/inbox"); return; }
    setAuth(authData);
  }, [router]);

  useEffect(() => {
    if (!auth) return;
    loadAccounts();
  }, [auth]);

  useEffect(() => {
    if (!auth?.token) return;
    starflowWS.connect(auth.token);
    const unsub = starflowWS.on("qr_auth_success", (raw) => {
      const data = raw as unknown as { auth_token: string; account: Account };
      if (data.auth_token === qrAuthToken) {
        setQrStatus("success");
        setAccounts((prev) => [...prev, data.account]);
        setTimeout(() => { setDialogOpen(false); resetDialog(); }, 1000);
      }
    });
    return unsub;
  }, [auth, qrAuthToken]);

  const loadAccounts = async () => {
    try {
      const data = await accountsApi.list();
      setAccounts(data);
    } catch {} finally { setLoading(false); }
  };

  const startQrAuth = useCallback(async () => {
    setQrStatus("loading");
    setError("");
    clearQrTimers();
    try {
      const result = await accountsApi.startQrAuth();
      setQrUrl(result.qr_url);
      setQrAuthToken(result.auth_token);
      setQrStatus("pending");

      const pollId = setInterval(async () => {
        try {
          const status = await accountsApi.qrStatus(result.auth_token);
          if (status.status === "success" && status.account) {
            setQrStatus("success");
            setAccounts((prev) => {
              if (prev.some((a) => a.id === status.account.id)) return prev;
              return [...prev, status.account];
            });
            clearQrTimers();
            setTimeout(() => { setDialogOpen(false); resetDialog(); }, 1000);
          } else if (status.status === "needs_password") {
            setQrStatus("needs_password");
            clearQrTimers();
          } else if (status.status === "error") {
            setError(status.error || "QR auth failed");
            setQrStatus("expired");
            clearQrTimers();
          } else if (status.status === "expired") {
            setQrStatus("expired");
            clearQrTimers();
          }
        } catch {}
      }, 2000);
      qrPollTimer.current = pollId;

      const refreshId = setTimeout(() => {
        setQrStatus("expired");
        clearInterval(pollId);
      }, 30000);
      qrRefreshTimer.current = refreshId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start QR auth");
      setQrStatus("idle");
    }
  }, []);

  const clearQrTimers = () => {
    if (qrRefreshTimer.current) { clearTimeout(qrRefreshTimer.current); qrRefreshTimer.current = null; }
    if (qrPollTimer.current) { clearInterval(qrPollTimer.current); qrPollTimer.current = null; }
  };

  useEffect(() => {
    if (dialogOpen && activeTab === "qr" && qrStatus === "idle") { startQrAuth(); }
    if (!dialogOpen) { clearQrTimers(); }
  }, [dialogOpen, activeTab, qrStatus, startQrAuth]);

  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const result = await accountsApi.startAuth(phone);
      setAuthToken(result.auth_token);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally { setSubmitting(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await accountsApi.verifyCode(authToken, phone, code);
      setDialogOpen(false);
      resetDialog();
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally { setSubmitting(false); }
  };

  const handleDisconnect = async (id: number) => {
    try {
      await accountsApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const resetDialog = () => {
    setActiveTab("qr"); setStep("phone"); setPhone(""); setCode("");
    setAuthToken(""); setError(""); setQrUrl(""); setQrAuthToken("");
    setQrStatus("idle"); setTwoFaPassword(""); setTwoFaSubmitting(false);
    clearQrTimers();
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
            <Link href="/accounts"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-900 dark:text-white bg-black/5 dark:bg-white/10">Accounts</Button></Link>
            <Link href="/chatters"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Chatters</Button></Link>
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Telegram Accounts</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDialog(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25">Connect Account</Button>
            </DialogTrigger>
            <DialogContent className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/70 dark:border-white/10 sm:max-w-md shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Connect Telegram Account</DialogTitle>
              </DialogHeader>

              <div className="flex border-b border-slate-200/70 dark:border-white/10 mb-4">
                <button className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === "qr" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white"}`}
                  onClick={() => { setActiveTab("qr"); setError(""); }}>QR Code</button>
                <button className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === "phone" ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500" : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white"}`}
                  onClick={() => { setActiveTab("phone"); setError(""); }}>Phone Number</button>
              </div>

              {error && <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">{error}</div>}

              {activeTab === "qr" && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {qrStatus === "loading" && (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                  )}
                  {qrStatus === "pending" && qrUrl && (
                    <>
                      <div className="bg-white p-3 rounded-lg shadow-lg">
                        <QRCodeSVG value={qrUrl} size={192} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-white/50 text-center">
                        Open Telegram &rarr; Settings &rarr; Devices &rarr; Scan QR Code
                      </p>
                    </>
                  )}
                  {qrStatus === "success" && (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-medium">Connected!</p>
                    </div>
                  )}
                  {qrStatus === "needs_password" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setTwoFaSubmitting(true); setError("");
                        try {
                          const result = await accountsApi.submitQrPassword(qrAuthToken, twoFaPassword);
                          if (result.status === "success" && result.account) {
                            setQrStatus("success");
                            setAccounts((prev) => {
                              if (prev.some((a: Account) => a.id === result.account.id)) return prev;
                              return [...prev, result.account];
                            });
                            setTimeout(() => { setDialogOpen(false); resetDialog(); }, 1000);
                          } else { setError(result.error || "Invalid password"); }
                        } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit password"); }
                        finally { setTwoFaSubmitting(false); }
                      }}
                      className="flex flex-col items-center gap-4 py-2 w-full"
                    >
                      <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-white/50 text-center">
                        This account has two-factor authentication enabled. Enter your Telegram 2FA password.
                      </p>
                      <Input type="password" placeholder="2FA Password" value={twoFaPassword}
                        onChange={(e) => setTwoFaPassword(e.target.value)} required
                        className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" disabled={twoFaSubmitting}>
                        {twoFaSubmitting ? "Verifying..." : "Submit Password"}
                      </Button>
                    </form>
                  )}
                  {qrStatus === "expired" && (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                      <p className="text-sm text-slate-400 dark:text-white/40">QR code expired</p>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        onClick={() => { setQrStatus("idle"); startQrAuth(); }}>Refresh</Button>
                    </div>
                  )}
                  {qrStatus === "idle" && (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "phone" && (
                <>
                  {step === "phone" ? (
                    <form onSubmit={handleStartAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-white/70">Phone Number (with country code)</Label>
                        <Input placeholder="+1234567890" value={phone}
                          onChange={(e) => setPhone(e.target.value)} required
                          className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" disabled={submitting}>
                        {submitting ? "Sending..." : "Send Code"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-white/70">Verification Code</Label>
                        <Input placeholder="12345" value={code}
                          onChange={(e) => setCode(e.target.value)} required
                          className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
                        <p className="text-xs text-slate-400 dark:text-white/40">Check your Telegram app for the code</p>
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" disabled={submitting}>
                        {submitting ? "Verifying..." : "Verify"}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-8 text-center text-slate-400 dark:text-white/40">
              No Telegram accounts connected yet
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl overflow-hidden transition-all hover:border-blue-300/50 dark:hover:border-white/20 shadow-lg dark:shadow-none">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {editingId === account.id ? (
                        <form className="flex items-center gap-2"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try { await accountsApi.rename(account.id, editName); setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, display_name: editName } : a)); } catch {}
                            setEditingId(null);
                          }}>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                            className="h-7 w-48 bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-sm" autoFocus
                            onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }} />
                          <Button type="submit" variant="ghost" size="sm" className="h-7 text-green-600 dark:text-green-400 text-xs px-2">Save</Button>
                          <Button type="button" variant="ghost" size="sm" className="h-7 text-slate-400 text-xs px-2" onClick={() => setEditingId(null)}>Cancel</Button>
                        </form>
                      ) : (
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => { setEditingId(account.id); setEditName(account.display_name || account.phone); }}
                          title="Click to rename">
                          {account.display_name || account.phone}
                        </h3>
                      )}
                      {account.proxy_host && (
                        <Badge className="bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 text-xs border-0">Proxy</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={account.is_active ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 border-0" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border-0"}>
                        {account.is_active ? "Active" : "Disconnected"}
                      </Badge>
                      {account.is_active && (
                        <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-xs"
                          disabled={syncingId === account.id}
                          onClick={async () => {
                            setSyncingId(account.id); setSyncResult(null);
                            try {
                              const result = await accountsApi.syncHistory(account.id);
                              setSyncResult(`Synced ${result.conversations_synced} conversations, ${result.messages_synced} messages`);
                            } catch (err) { setSyncResult(err instanceof Error ? err.message : "Sync failed"); }
                            finally { setSyncingId(null); }
                          }}>
                          {syncingId === account.id ? "Syncing..." : "Sync Chat History"}
                        </Button>
                      )}
                      <Link href={`/accounts/${account.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-xs">Dashboard &rarr;</Button>
                      </Link>
                      {account.is_active && (
                        <Button variant="ghost" size="sm" className="text-red-500 dark:text-red-400 hover:text-red-400" onClick={() => handleDisconnect(account.id)}>Disconnect</Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-white/50 space-y-1">
                    <div>Phone: {account.phone}</div>
                    {account.username && <div>@{account.username}</div>}
                    {account.proxy_host && <div>Proxy: {account.proxy_host}:{account.proxy_port}{account.proxy_username && ` (${account.proxy_username})`}</div>}
                    {syncResult && syncingId === null && <div className="text-xs text-green-600 dark:text-green-400 mt-1">{syncResult}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
