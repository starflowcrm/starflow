"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthData, accountsApi, botTokenApi } from "@/lib/api";

interface Account {
  id: number;
  phone: string;
  display_name: string | null;
  username: string | null;
  is_active: boolean;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_username: string | null;
  proxy_password: string | null;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  const [proxySaving, setProxySaving] = useState(false);
  const [proxySuccess, setProxySuccess] = useState("");

  const [hasBotToken, setHasBotToken] = useState(false);
  const [botTokenPreview, setBotTokenPreview] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const [businessConnectionId, setBusinessConnectionId] = useState("");
  const [botSaving, setBotSaving] = useState(false);
  const [botError, setBotError] = useState("");
  const [botSuccess, setBotSuccess] = useState("");

  useEffect(() => {
    const auth = getAuthData();
    if (!auth?.token) { router.replace("/login"); return; }
    if (auth.role !== "agency") { router.replace("/inbox"); return; }

    Promise.all([
      accountsApi.list().then((accounts: Account[]) => {
        const found = accounts.find((a: Account) => a.id === accountId);
        if (found) {
          setAccount(found);
          setProxyHost(found.proxy_host || "");
          setProxyPort(found.proxy_port ? String(found.proxy_port) : "");
          setProxyUsername(found.proxy_username || "");
          setProxyPassword(found.proxy_password || "");
        }
      }),
      botTokenApi.get(accountId).then((data: { has_bot_token: boolean; bot_token_preview: string | null; business_connection_id: string | null }) => {
        setHasBotToken(data.has_bot_token);
        setBotTokenPreview(data.bot_token_preview);
        setBusinessConnectionId(data.business_connection_id || "");
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [router, accountId]);

  const handleSaveProxy = async () => {
    setProxySaving(true); setProxySuccess("");
    try {
      await accountsApi.updateProxy(accountId, {
        proxy_host: proxyHost || null, proxy_port: proxyPort ? parseInt(proxyPort) : null,
        proxy_username: proxyUsername || null, proxy_password: proxyPassword || null,
      });
      setProxySuccess("Proxy saved");
      setTimeout(() => setProxySuccess(""), 3000);
    } catch {} finally { setProxySaving(false); }
  };

  const handleClearProxy = async () => {
    setProxySaving(true);
    try {
      await accountsApi.updateProxy(accountId, { proxy_host: null, proxy_port: null, proxy_username: null, proxy_password: null });
      setProxyHost(""); setProxyPort(""); setProxyUsername(""); setProxyPassword("");
      setProxySuccess("Proxy cleared");
      setTimeout(() => setProxySuccess(""), 3000);
    } catch {} finally { setProxySaving(false); }
  };

  const handleSaveBotToken = async () => {
    setBotSaving(true); setBotError(""); setBotSuccess("");
    try {
      const payload: Record<string, string> = {};
      if (botToken) payload.bot_token = botToken;
      payload.business_connection_id = businessConnectionId;
      const result = await botTokenApi.update(payload, accountId);
      setHasBotToken(!!result.bot_token);
      setBotTokenPreview(result.bot_token);
      setBusinessConnectionId(result.business_connection_id || "");
      setBotToken("");
      setBotSuccess("Bot settings saved");
      setTimeout(() => setBotSuccess(""), 3000);
    } catch (err) {
      setBotError(err instanceof Error ? err.message : "Failed to save");
    } finally { setBotSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="animate-pulse text-slate-400 dark:text-white/40">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="text-center space-y-3">
          <p className="text-slate-400 dark:text-white/50">Account not found</p>
          <Link href="/accounts"><Button variant="ghost" size="sm">Back to Accounts</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <Link href={`/accounts/${accountId}`} className="text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white text-sm transition-colors">&larr; Account Dashboard</Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
        </div>
        <span className="text-sm text-slate-400 dark:text-white/40">{account.display_name || account.phone}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Bot Token Section */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-lg dark:shadow-none">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white/80">Bot for Locked Media</h2>

          {hasBotToken && botTokenPreview && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-3 py-2 rounded-lg border border-green-200 dark:border-green-400/20">
              <span>Bot connected: {botTokenPreview}</span>
            </div>
          )}

          {botError && <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-2 rounded border border-red-200 dark:border-red-400/20">{botError}</div>}
          {botSuccess && <div className="text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-400/10 p-2 rounded border border-green-200 dark:border-green-400/20">{botSuccess}</div>}

          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-white/60">
              Bot Token <span className="text-slate-400 dark:text-white/40">(from @BotFather)</span>
            </Label>
            <Input type="password"
              placeholder={hasBotToken ? "Enter new token to replace existing" : "e.g. 8123456789:AAFxxx..."}
              value={botToken} onChange={e => setBotToken(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-white/60">
              Business Connection ID <span className="text-slate-400 dark:text-white/40">(optional)</span>
            </Label>
            <Input placeholder="Sent by your bot when you add it as a Business Bot"
              value={businessConnectionId} onChange={e => setBusinessConnectionId(e.target.value)}
              className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
          </div>

          <p className="text-xs text-slate-400 dark:text-white/40">
            Stars earned go to this bot&apos;s wallet. Withdraw via BotFather &rarr; Monetization &rarr; Withdraw.
          </p>

          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            onClick={handleSaveBotToken}
            disabled={botSaving || (!botToken && !businessConnectionId)}>
            {botSaving ? "Saving..." : "Save Bot Settings"}
          </Button>
        </div>

        {/* Proxy Section */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-lg dark:shadow-none">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white/80">SOCKS5 Proxy</h2>
          {proxySuccess && <div className="text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-400/10 p-2 rounded border border-green-200 dark:border-green-400/20">{proxySuccess}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-white/60">Host</Label>
              <Input placeholder="127.0.0.1" value={proxyHost} onChange={e => setProxyHost(e.target.value)}
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-white/60">Port</Label>
              <Input type="number" placeholder="1080" value={proxyPort} onChange={e => setProxyPort(e.target.value)}
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-white/60">Username (optional)</Label>
              <Input placeholder="user" value={proxyUsername} onChange={e => setProxyUsername(e.target.value)}
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-white/60">Password (optional)</Label>
              <Input type="password" placeholder="pass" value={proxyPassword} onChange={e => setProxyPassword(e.target.value)}
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              onClick={handleSaveProxy} disabled={proxySaving}>
              {proxySaving ? "Saving..." : "Save Proxy"}
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white"
              onClick={handleClearProxy} disabled={proxySaving}>Clear</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
