"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

interface Agency {
  id: number;
  name: string;
  email: string;
  subscription_status: string | null;
  account_count: number;
  team_member_count: number;
  credit_balance: number;
  total_sales_usd: number;
  total_commission_usd: number;
  created_at: string | null;
}

export default function AgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminApi.getAgencies().then(setAgencies).catch(console.error);
  }, []);

  const filtered = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agencies</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 w-72"
        />
      </div>

      <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-white/40 text-xs uppercase border-b border-white/5">
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-center px-5 py-3">Accounts</th>
              <th className="text-center px-5 py-3">Team</th>
              <th className="text-right px-5 py-3">Credit Balance</th>
              <th className="text-right px-5 py-3">MRR</th>
              <th className="text-right px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const extra = Math.max(0, a.account_count - 1);
              const mrrContrib = a.subscription_status === "active" ? 29.99 + extra * 4.99 : 0;
              return (
                <tr
                  key={a.id}
                  onClick={() => router.push(`/admin/agencies/${a.id}`)}
                  className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                >
                  <td className="px-5 py-3 text-white text-sm font-medium">{a.name}</td>
                  <td className="px-5 py-3 text-white/60 text-sm">{a.email}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={a.subscription_status} />
                  </td>
                  <td className="px-5 py-3 text-white/60 text-sm text-center">{a.account_count}</td>
                  <td className="px-5 py-3 text-white/60 text-sm text-center">{a.team_member_count}</td>
                  <td className="px-5 py-3 text-white/60 text-sm text-right">
                    ${a.credit_balance.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-white/60 text-sm text-right">
                    ${mrrContrib.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-white/40 text-sm text-right">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-white/30 text-sm">
                  {search ? "No agencies match your search" : "No agencies yet"}
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
