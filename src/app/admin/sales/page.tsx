"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

interface Sale {
  id: number;
  agency_id: number;
  agency_name: string;
  star_count: number;
  usd_value: number;
  commission_amount: number;
  created_at: string | null;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    adminApi.getSales({ limit: 100 }).then(setSales).catch(console.error);
  }, []);

  const totalUsd = sales.reduce((s, x) => s + x.usd_value, 0);
  const totalCommission = sales.reduce((s, x) => s + x.commission_amount, 0);
  const totalStars = sales.reduce((s, x) => s + x.star_count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Sales</h1>

      <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-white/40 text-xs uppercase border-b border-white/5">
              <th className="text-left px-5 py-3">Agency</th>
              <th className="text-right px-5 py-3">Stars</th>
              <th className="text-right px-5 py-3">USD Value</th>
              <th className="text-right px-5 py-3">Commission (5%)</th>
              <th className="text-right px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-white text-sm">{s.agency_name}</td>
                <td className="px-5 py-3 text-white/60 text-sm text-right">{s.star_count}</td>
                <td className="px-5 py-3 text-white/60 text-sm text-right">${s.usd_value.toFixed(2)}</td>
                <td className="px-5 py-3 text-white/60 text-sm text-right">${s.commission_amount.toFixed(2)}</td>
                <td className="px-5 py-3 text-white/40 text-sm text-right">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">
                  No sales yet
                </td>
              </tr>
            )}
          </tbody>
          {sales.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td className="px-5 py-3 text-white font-semibold text-sm">Totals</td>
                <td className="px-5 py-3 text-white font-semibold text-sm text-right">{totalStars}</td>
                <td className="px-5 py-3 text-white font-semibold text-sm text-right">${totalUsd.toFixed(2)}</td>
                <td className="px-5 py-3 text-white font-semibold text-sm text-right">${totalCommission.toFixed(2)}</td>
                <td className="px-5 py-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
