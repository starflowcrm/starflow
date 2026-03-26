"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Tab state: "qr" or "phone"
  const [activeTab, setActiveTab] = useState<"qr" | "phone">("qr");

  // QR auth state
  const [qrUrl, setQrUrl] = useState("");
  const [qrAuthToken, setQrAuthToken] = useState("");
  const [qrStatus, setQrStatus] = useState<"idle" | "loading" | "pending" | "success" | "expired">("idle");
  const qrRefreshTimer = useRef<NodeJS.Timeout | null>(null);
  const qrPollTimer = useRef<NodeJS.Timeout | null>(null);

  // Phone auth state
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    loadAccounts();
  }, [auth]);

  // WebSocket listener for QR auth success
  useEffect(() => {
    if (!auth?.token) return;
    starflowWS.connect(auth.token);
    const unsub = starflowWS.on("qr_auth_success", (raw) => {
      const data = raw as unknown as { auth_token: string; account: Account };
      if (data.auth_token === qrAuthToken) {
        setQrStatus("success");
        setAccounts((prev) => [...prev, data.account]);
        setTimeout(() => {
          setDialogOpen(false);
          resetDialog();
        }, 1000);
      }
    });
    return unsub;
  }, [auth, qrAuthToken]);

  const loadAccounts = async () => {
    try {
      const data = await accountsApi.list();
      setAccounts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // --- QR Code auth ---

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
            setTimeout(() => {
              setDialogOpen(false);
              resetDialog();
            }, 1000);
          } else if (status.status === "expired") {
            setQrStatus("expired");
            clearQrTimers();
          }
        } catch {
          // ignore poll errors
        }
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
    if (qrRefreshTimer.current) {
      clearTimeout(qrRefreshTimer.current);
      qrRefreshTimer.current = null;
    }
    if (qrPollTimer.current) {
      clearInterval(qrPollTimer.current);
      qrPollTimer.current = null;
    }
  };

  useEffect(() => {
    if (dialogOpen && activeTab === "qr" && qrStatus === "idle") {
      startQrAuth();
    }
    if (!dialogOpen) {
      clearQrTimers();
    }
  }, [dialogOpen, activeTab, qrStatus, startQrAuth]);

  // --- Phone auth ---

  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await accountsApi.startAuth(phone);
      setAuthToken(result.auth_token);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await accountsApi.verifyCode(authToken, phone, code);
      setDialogOpen(false);
      resetDialog();
      await loadAccounts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (id: number) => {
    try {
      await accountsApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // ignore
    }
  };

  const resetDialog = () => {
    setActiveTab("qr");
    setStep("phone");
    setPhone("");
    setCode("");
    setAuthToken("");
    setError("");
    setQrUrl("");
    setQrAuthToken("");
    setQrStatus("idle");
    clearQrTimers();
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
              <Button variant="ghost" size="sm" className="text-white">
                Accounts
              </Button>
            </Link>
            <Link href="/chatters">
              <Button variant="ghost" size="sm">
                Chatters
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
          <h1 className="text-2xl font-bold">Telegram Accounts</h1>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Telegram Account</DialogTitle>
              </DialogHeader>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-4">
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === "qr"
                      ? "text-blue-400 border-b-2 border-blue-400"
                      : "text-muted-foreground hover:text-white"
                  }`}
                  onClick={() => {
                    setActiveTab("qr");
                    setError("");
                  }}
                >
                  QR Code
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === "phone"
                      ? "text-blue-400 border-b-2 border-blue-400"
                      : "text-muted-foreground hover:text-white"
                  }`}
                  onClick={() => {
                    setActiveTab("phone");
                    setError("");
                  }}
                >
                  Phone Number
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === "qr" && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {qrStatus === "loading" && (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                    </div>
                  )}
                  {qrStatus === "pending" && qrUrl && (
                    <>
                      <div className="bg-white p-3 rounded-lg">
                        <QRCodeSVG value={qrUrl} size={192} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Open Telegram &rarr; Settings &rarr; Devices &rarr; Scan QR Code
                      </p>
                    </>
                  )}
                  {qrStatus === "success" && (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-400 font-medium">Connected!</p>
                    </div>
                  )}
                  {qrStatus === "expired" && (
                    <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                      <p className="text-sm text-muted-foreground">QR code expired</p>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setQrStatus("idle");
                          startQrAuth();
                        }}
                      >
                        Refresh
                      </Button>
                    </div>
                  )}
                  {qrStatus === "idle" && (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Phone Number Tab */}
              {activeTab === "phone" && (
                <>
                  {step === "phone" ? (
                    <form onSubmit={handleStartAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Phone Number (with country code)</Label>
                        <Input
                          placeholder="+1234567890"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="bg-[#0f0f0f] border-white/10"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={submitting}
                      >
                        {submitting ? "Sending..." : "Send Code"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Verification Code</Label>
                        <Input
                          placeholder="12345"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                          className="bg-[#0f0f0f] border-white/10"
                        />
                        <p className="text-xs text-muted-foreground">
                          Check your Telegram app for the code
                        </p>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={submitting}
                      >
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
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardContent className="py-8 text-center text-muted-foreground">
                No Telegram accounts connected yet
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
                <Card key={account.id} className="bg-[#1a1a1a] border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {account.display_name || account.phone}
                        </CardTitle>
                        {account.proxy_host && (
                          <Badge className="bg-purple-600/20 text-purple-400 text-xs">
                            Proxy
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={account.is_active ? "default" : "secondary"}
                          className={
                            account.is_active
                              ? "bg-green-600/20 text-green-400"
                              : ""
                          }
                        >
                          {account.is_active ? "Active" : "Disconnected"}
                        </Badge>
                        <Link href={`/accounts/${account.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs">
                            Dashboard &rarr;
                          </Button>
                        </Link>
                        {account.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDisconnect(account.id)}
                          >
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Phone: {account.phone}</div>
                      {account.username && <div>@{account.username}</div>}
                      {account.proxy_host && (
                        <div>
                          Proxy: {account.proxy_host}:{account.proxy_port}
                          {account.proxy_username && ` (${account.proxy_username})`}
                        </div>
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
