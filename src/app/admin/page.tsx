"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Link from "next/link";

interface Stats {
  total_agencies: number;
  active_subscriptions: number;
  mrr: number;
  total_credit_balance: number;
  total_commission_earned: number;
  total_sales_count: number;
}

interface AgencySummary {
  id: number;
  name: string;
  email: string;
  subscription_status: string | null;
  account_count: number;
  credit_balance: number;
  created_at: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agencies, setAgencies] = useState<AgencySummary[]>([]);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(console.error);
    adminApi.getAgencies().then((data) => setAgencies(data.slice(0, 10))).catch(console.error);
  }, []);

  const statCards = stats
    ? [
        { label: "Total Agencies", value: stats.total_agencies, icon: "◈" },
        { label: "Active Subscriptions", value: stats.active_subscriptions, icon: "●" },
        { label: "MRR", value: `$${stats.mrr.toFixed(2)}`, icon: "$" },
        { label: "Total Commission", value: `$${stats.total_commission_earned.toFixed(2)}`, icon: "◇" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-[#111118] border border-white/10 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm">
                {s.icon}
              </span>
              <span className="text-white/50 text-sm">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent agencies */}
      <div className="bg-[#111118] border border-white/10 rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-semibold">Recent Agencies</h2>
          <Link
            href="/admin/agencies"
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-white/40 text-xs uppercase border-b border-white/5">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Accounts</th>
              <th className="text-right px-5 py-3">Credit Balance</th>
              <th className="text-right px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr
                key={a.id}
                className="border-b border-white/5 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 text-white text-sm">{a.name}</td>
                <td className="px-5 py-3 text-white/60 text-sm">{a.email}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={a.subscription_status} />
                </td>
                <td className="px-5 py-3 text-white/60 text-sm">{a.account_count}</td>
                <td className="px-5 py-3 text-white/60 text-sm text-right">
                  ${a.credit_balance.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-white/40 text-sm text-right">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {agencies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">
                  No agencies yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    past_due: "bg-yellow-500/20 text-yellow-400",
    canceled: "bg-red-500/20 text-red-400",
    trialing: "bg-gray-500/20 text-gray-400",
  };
  const cls = colors[status || ""] || "bg-gray-500/20 text-gray-500";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status || "none"}
    </span>
  );
}
