"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthData, accountsApi } from "@/lib/api";

interface Account {
  id: number;
  phone: string;
  display_name: string | null;
  username: string | null;
  is_active: boolean;
}

export default function AccountDashboard() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthData();
    if (!auth?.token) { router.replace("/login"); return; }
    if (auth.role !== "agency") { router.replace("/inbox"); return; }

    accountsApi.list().then((accounts: Account[]) => {
      const found = accounts.find((a: Account) => a.id === accountId);
      if (found) setAccount(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router, accountId]);

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

  const sections = [
    { href: `/accounts/${accountId}/vault`, icon: "\uD83D\uDCC1", title: "Vault", desc: "Content library for this account" },
    { href: `/accounts/${accountId}/settings`, icon: "\u2699\uFE0F", title: "Settings", desc: "Proxy, bot token, business connection" },
    { href: `/accounts/${accountId}/analytics`, icon: "\uD83D\uDCCA", title: "Analytics", desc: "Coming soon" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/[0.06] bg-[#0e0e0e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts" className="text-white/50 hover:text-white text-sm">&larr; Accounts</Link>
          <h1 className="text-lg font-semibold">{account.display_name || account.phone}</h1>
          <Badge className={account.is_active ? "bg-green-600/20 text-green-400" : "bg-white/10 text-white/50"}>
            {account.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Link href="/inbox">
          <Button variant="ghost" size="sm" className="text-white/50">Inbox</Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6 text-sm text-white/40 space-y-1">
          <div>Phone: {account.phone}</div>
          {account.username && <div>@{account.username}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="bg-[#111] border-white/[0.06] hover:border-white/20 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 space-y-2">
                  <div className="text-3xl">{s.icon}</div>
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  <p className="text-xs text-white/40">{s.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
