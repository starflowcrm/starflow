"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  // Proxy state
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  const [proxySaving, setProxySaving] = useState(false);
  const [proxySuccess, setProxySuccess] = useState("");

  // Bot token state
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
    setProxySaving(true);
    setProxySuccess("");
    try {
      await accountsApi.updateProxy(accountId, {
        proxy_host: proxyHost || null,
        proxy_port: proxyPort ? parseInt(proxyPort) : null,
        proxy_username: proxyUsername || null,
        proxy_password: proxyPassword || null,
      });
      setProxySuccess("Proxy saved");
      setTimeout(() => setProxySuccess(""), 3000);
    } catch {} finally { setProxySaving(false); }
  };

  const handleClearProxy = async () => {
    setProxySaving(true);
    try {
      await accountsApi.updateProxy(accountId, {
        proxy_host: null, proxy_port: null,
        proxy_username: null, proxy_password: null,
      });
      setProxyHost(""); setProxyPort("");
      setProxyUsername(""); setProxyPassword("");
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center space-y-3">
          <p className="text-white/50">Account not found</p>
          <Link href="/accounts"><Button variant="ghost" size="sm">Back to Accounts</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/[0.06] bg-[#0e0e0e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/accounts/${accountId}`} className="text-white/50 hover:text-white text-sm">&larr; Account Dashboard</Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <span className="text-sm text-white/40">{account.display_name || account.phone}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Bot Token Section */}
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/80">Bot for Locked Media</h2>

            {hasBotToken && botTokenPreview && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">
                <span>Bot connected: {botTokenPreview}</span>
              </div>
            )}

            {botError && <div className="text-sm text-red-400 bg-red-400/10 p-2 rounded">{botError}</div>}
            {botSuccess && <div className="text-sm text-green-400 bg-green-400/10 p-2 rounded">{botSuccess}</div>}

            <div className="space-y-1">
              <Label className="text-xs">
                Bot Token <span className="text-white/40">(from @BotFather)</span>
              </Label>
              <Input type="password"
                placeholder={hasBotToken ? "Enter new token to replace existing" : "e.g. 8123456789:AAFxxx..."}
                value={botToken} onChange={e => setBotToken(e.target.value)}
                className="bg-[#0a0a0a] border-white/10" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                Business Connection ID <span className="text-white/40">(optional)</span>
              </Label>
              <Input placeholder="Sent by your bot when you add it as a Business Bot"
                value={businessConnectionId} onChange={e => setBusinessConnectionId(e.target.value)}
                className="bg-[#0a0a0a] border-white/10" />
            </div>

            <p className="text-xs text-muted-foreground">
              Stars earned go to this bot&apos;s wallet. Withdraw via BotFather &rarr; Monetization &rarr; Withdraw.
            </p>

            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveBotToken}
              disabled={botSaving || (!botToken && !businessConnectionId)}>
              {botSaving ? "Saving..." : "Save Bot Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Proxy Section */}
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-white/80">SOCKS5 Proxy</h2>
            {proxySuccess && <div className="text-sm text-green-400 bg-green-400/10 p-2 rounded">{proxySuccess}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Host</Label>
                <Input placeholder="127.0.0.1" value={proxyHost}
                  onChange={e => setProxyHost(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Port</Label>
                <Input type="number" placeholder="1080" value={proxyPort}
                  onChange={e => setProxyPort(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Username (optional)</Label>
                <Input placeholder="user" value={proxyUsername}
                  onChange={e => setProxyUsername(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password (optional)</Label>
                <Input type="password" placeholder="pass" value={proxyPassword}
                  onChange={e => setProxyPassword(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveProxy} disabled={proxySaving}>
                {proxySaving ? "Saving..." : "Save Proxy"}
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white"
                onClick={handleClearProxy} disabled={proxySaving}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
