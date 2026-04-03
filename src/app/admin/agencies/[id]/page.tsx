"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

interface AgencyDetail {
  id: number;
  name: string;
  email: string;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  credit_balance: number;
  stripe_customer_id: string | null;
  account_count: number;
  team_member_count: number;
  total_sales_usd: number;
  total_commission_usd: number;
  created_at: string | null;
  accounts: { id: number; phone: string; display_name: string | null; username: string | null; is_active: boolean; created_at: string | null }[];
  chatters: { id: number; name: string; email: string; created_at: string | null }[];
  sales: { id: number; star_count: number; usd_value: number; commission_amount: number; created_at: string | null }[];
  topups: { id: number; amount_usd: number; stripe_payment_intent_id: string; created_at: string | null }[];
}

type Tab = "accounts" | "team" | "sales" | "topups";

export default function AgencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = Number(params.id);
  const [agency, setAgency] = useState<AgencyDetail | null>(null);
  const [tab, setTab] = useState<Tab>("accounts");

  // Modals
  const [showCredits, setShowCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("active");

  useEffect(() => {
    adminApi.getAgency(agencyId).then(setAgency).catch(console.error);
  }, [agencyId]);

  const handleAdjustCredits = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || !creditNote) return;
    try {
      const res = await adminApi.adjustCredits(agencyId, amount, creditNote);
      setAgency((prev) => prev ? { ...prev, credit_balance: res.credit_balance } : prev);
      setShowCredits(false);
      setCreditAmount("");
      setCreditNote("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleSetStatus = async () => {
    try {
      const res = await adminApi.setSubscriptionStatus(agencyId, newStatus);
      setAgency((prev) => prev ? { ...prev, subscription_status: res.subscription_status } : prev);
      setShowStatus(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleImpersonate = async () => {
    try {
      const res = await adminApi.impersonate(agencyId);
      localStorage.setItem("starflow_token", res.token);
      localStorage.setItem(
        "starflow_auth",
        JSON.stringify({ token: res.token, role: "agency", name: res.agency_name, agency_id: agencyId, user_id: agencyId })
      );
      window.open("/inbox", "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  if (!agency) {
    return <div className="text-white/50">Loading...</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "accounts", label: `Accounts (${agency.accounts.length})` },
    { key: "team", label: `Team (${agency.chatters.length})` },
    { key: "sales", label: `Sales (${agency.sales.length})` },
    { key: "topups", label: `Topups (${agency.topups.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/admin/agencies")} className="text-white/40 text-sm hover:text-white/60 mb-2 block">
            &larr; Back to agencies
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{agency.name}</h1>
            <StatusBadge status={agency.subscription_status} />
          </div>
          <p className="text-white/40 text-sm mt-1">{agency.email}</p>
        </div>
        <button
          onClick={handleImpersonate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          Impersonate
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Credit Balance", value: `$${agency.credit_balance.toFixed(2)}` },
          { label: "Total Sales", value: `$${agency.total_sales_usd.toFixed(2)}` },
          { label: "Total Commission", value: `$${agency.total_commission_usd.toFixed(2)}` },
          { label: "Accounts", value: agency.account_count },
        ].map((s) => (
          <div key={s.label} className="bg-[#111118] border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-xs mb-1">{s.label}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowCredits(true)}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-lg px-4 py-2 transition-colors"
        >
          Adjust Credits
        </button>
        <button
          onClick={() => { setNewStatus(agency.subscription_status || "active"); setShowStatus(true); }}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-lg px-4 py-2 transition-colors"
        >
          Set Subscription Status
        </button>
      </div>

      {/* Credits modal */}
      {showCredits && (
        <Modal onClose={() => setShowCredits(false)} title="Adjust Credits">
          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs block mb-1">Amount (positive to add, negative to deduct)</label>
              <input
                type="number"
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="e.g. 50.00 or -10.00"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs block mb-1">Note</label>
              <input
                type="text"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="Reason for adjustment"
              />
            </div>
            <button
              onClick={handleAdjustCredits}
              disabled={!creditAmount || !creditNote}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Apply
            </button>
          </div>
        </Modal>
      )}

      {/* Status modal */}
      {showStatus && (
        <Modal onClose={() => setShowStatus(false)} title="Set Subscription Status">
          <div className="space-y-4">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
            <button
              onClick={handleSetStatus}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Update Status
            </button>
          </div>
        </Modal>
      )}

      {/* Tabs */}
      <div className="bg-[#111118] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-0">
          {tab === "accounts" && (
            <table className="w-full">
              <thead>
                <tr className="text-white/40 text-xs uppercase border-b border-white/5">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Display Name</th>
                  <th className="text-left px-5 py-3">Username</th>
                  <th className="text-left px-5 py-3">Active</th>
                  <th className="text-right px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {agency.accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-white/5">
                    <td className="px-5 py-3 text-white/60 text-sm">{acc.id}</td>
                    <td className="px-5 py-3 text-white text-sm">{acc.phone}</td>
                    <td className="px-5 py-3 text-white/60 text-sm">{acc.display_name || "-"}</td>
                    <td className="px-5 py-3 text-white/60 text-sm">{acc.username ? `@${acc.username}` : "-"}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className={acc.is_active ? "text-green-400" : "text-red-400"}>
                        {acc.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-sm text-right">
                      {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {agency.accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-white/30 text-sm">No accounts</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "team" && (
            <table className="w-full">
              <thead>
                <tr className="text-white/40 text-xs uppercase border-b border-white/5">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-right px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {agency.chatters.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="px-5 py-3 text-white/60 text-sm">{c.id}</td>
                    <td className="px-5 py-3 text-white text-sm">{c.name}</td>
                    <td className="px-5 py-3 text-white/60 text-sm">{c.email}</td>
                    <td className="px-5 py-3 text-white/40 text-sm text-right">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {agency.chatters.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-white/30 text-sm">No team members</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "sales" && (
            <table className="w-full">
              <thead>
                <tr className="text-white/40 text-xs uppercase border-b border-white/5">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-right px-5 py-3">Stars</th>
                  <th className="text-right px-5 py-3">USD Value</th>
                  <th className="text-right px-5 py-3">Commission</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {agency.sales.map((s) => (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="px-5 py-3 text-white/60 text-sm">{s.id}</td>
                    <td className="px-5 py-3 text-white text-sm text-right">{s.star_count}</td>
                    <td className="px-5 py-3 text-white/60 text-sm text-right">${s.usd_value.toFixed(2)}</td>
                    <td className="px-5 py-3 text-white/60 text-sm text-right">${s.commission_amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-white/40 text-sm text-right">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {agency.sales.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">No sales</td></tr>
                )}
              </tbody>
            </table>
          )}

          {tab === "topups" && (
            <table className="w-full">
              <thead>
                <tr className="text-white/40 text-xs uppercase border-b border-white/5">
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-right px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Payment Intent</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {agency.topups.map((t) => (
                  <tr key={t.id} className="border-b border-white/5">
                    <td className="px-5 py-3 text-white/60 text-sm">{t.id}</td>
                    <td className="px-5 py-3 text-white text-sm text-right">${t.amount_usd.toFixed(2)}</td>
                    <td className="px-5 py-3 text-white/40 text-sm font-mono text-xs">{t.stripe_payment_intent_id}</td>
                    <td className="px-5 py-3 text-white/40 text-sm text-right">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {agency.topups.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-white/30 text-sm">No topups</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
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

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#111118] border border-white/10 rounded-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
