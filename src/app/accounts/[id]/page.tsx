"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  const sections = [
    { href: `/accounts/${accountId}/vault`, icon: "\uD83D\uDCC1", title: "Vault", desc: "Content library for this account" },
    { href: `/accounts/${accountId}/settings`, icon: "\u2699\uFE0F", title: "Settings", desc: "Proxy, bot token, business connection" },
    { href: `/accounts/${accountId}/analytics`, icon: "\uD83D\uDCCA", title: "Analytics", desc: "Coming soon" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <Link href="/accounts" className="text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white text-sm transition-colors">&larr; Accounts</Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{account.display_name || account.phone}</h1>
          <Badge className={account.is_active ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 border-0" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 border-0"}>
            {account.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Link href="/inbox">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-white/50">Inbox</Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6 text-sm text-slate-400 dark:text-white/40 space-y-1">
          <div>Phone: {account.phone}</div>
          {account.username && <div>@{account.username}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl p-5 space-y-2 hover:border-blue-300/50 dark:hover:border-white/20 transition-all cursor-pointer hover:shadow-lg h-full">
                <div className="text-3xl">{s.icon}</div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 dark:text-white/40">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
