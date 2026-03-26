"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAuthData, accountsApi } from "@/lib/api";

export default function AccountAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    const auth = getAuthData();
    if (!auth?.token) { router.replace("/login"); return; }

    accountsApi.list().then((accounts: { id: number; display_name: string | null; phone: string }[]) => {
      const found = accounts.find((a) => a.id === accountId);
      if (found) setAccountName(found.display_name || found.phone);
    }).catch(() => {});
  }, [router, accountId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/[0.06] bg-[#0e0e0e] px-6 py-4 flex items-center gap-4">
        <Link href={`/accounts/${accountId}`} className="text-white/50 hover:text-white text-sm">&larr; Account Dashboard</Link>
        <h1 className="text-lg font-semibold">Analytics</h1>
        {accountName && <span className="text-sm text-white/40">{accountName}</span>}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4 opacity-30">📊</div>
        <h2 className="text-xl font-semibold mb-2">Analytics Coming Soon</h2>
        <p className="text-sm text-white/40">
          Track message volume, revenue from locked media, and engagement metrics.
        </p>
      </div>
    </div>
  );
}
