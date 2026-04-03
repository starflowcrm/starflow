"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

interface Session {
  account_id: number;
  agency_id: number | null;
  phone: string | null;
  display_name: string | null;
  is_connected: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const connected = sessions.filter((s) => s.is_connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
        <div className="text-sm text-white/50">
          {connected} / {sessions.length} connected
        </div>
      </div>

      <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-white/40 text-xs uppercase border-b border-white/5">
              <th className="text-left px-5 py-3">Account ID</th>
              <th className="text-left px-5 py-3">Agency ID</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Display Name</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.account_id} className="border-b border-white/5">
                <td className="px-5 py-3 text-white/60 text-sm">{s.account_id}</td>
                <td className="px-5 py-3 text-white/60 text-sm">{s.agency_id ?? "-"}</td>
                <td className="px-5 py-3 text-white text-sm">{s.phone || "-"}</td>
                <td className="px-5 py-3 text-white/60 text-sm">{s.display_name || "-"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      s.is_connected
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {s.is_connected ? "Connected" : "Disconnected"}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">
                  No active Telegram sessions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
