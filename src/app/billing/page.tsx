"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthData, clearAuth, billingApi } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface BillingStatus {
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  credit_balance: number;
  account_count: number;
  extra_accounts: number;
  base_price: number;
  extra_account_price: number;
  monthly_cost: number;
}

function SubscriptionForm({
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
      >
        {loading ? "Processing..." : "Confirm Payment"}
      </Button>
    </form>
  );
}

function TopupForm({
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
      >
        {loading ? "Processing..." : "Top Up Credits"}
      </Button>
    </form>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subClientSecret, setSubClientSecret] = useState<string | null>(null);
  const [topupClientSecret, setTopupClientSecret] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(20);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) { router.replace("/login"); return; }
    if (authData.role !== "agency") { router.replace("/inbox"); return; }
    setAuth(authData);
  }, [router]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await billingApi.status();
      setStatus(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (auth) loadStatus();
  }, [auth, loadStatus]);

  const handleActivate = async () => {
    setActionLoading(true); setError("");
    try {
      const { clientSecret } = await billingApi.createSubscription();
      setSubClientSecret(clientSecret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create subscription");
    } finally { setActionLoading(false); }
  };

  const handleTopup = async (amount: number) => {
    setActionLoading(true); setError(""); setTopupAmount(amount);
    try {
      const { clientSecret } = await billingApi.topup(amount);
      setTopupClientSecret(clientSecret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create top-up");
    } finally { setActionLoading(false); }
  };

  const handleLogout = () => { clearAuth(); router.push("/login"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative overflow-hidden">
        <div className="blob blob-1 w-72 h-72 bg-blue-500 top-20 -left-20" />
        <div className="blob blob-2 w-96 h-96 bg-indigo-500 -top-10 right-10" />
        <div className="animate-pulse text-slate-400 dark:text-white/40">Loading billing...</div>
      </div>
    );
  }

  const isActive = status?.subscription_status === "active";
  const periodEnd = status?.subscription_current_period_end
    ? new Date(status.subscription_current_period_end).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="blob blob-1 w-72 h-72 bg-blue-500 top-20 -left-20" />
      <div className="blob blob-2 w-96 h-96 bg-indigo-500 -top-10 right-10" />
      <div className="blob blob-3 w-64 h-64 bg-violet-500 bottom-10 left-1/3" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 shadow-sm dark:shadow-none sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Starflow</span>
          <nav className="flex items-center gap-1">
            <Link href="/inbox"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Inbox</Button></Link>
            <Link href="/accounts"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Accounts</Button></Link>
            <Link href="/chatters"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10">Chatters</Button></Link>
            <Link href="/billing"><Button variant="ghost" size="sm" className="text-xs h-8 text-slate-900 dark:text-white bg-black/5 dark:bg-white/10">Billing</Button></Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-all text-slate-700 dark:text-white/70" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-white/50">{auth?.name}</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">{auth?.role}</span>
          <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600 dark:text-white/60" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-6 relative z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Billing</h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Subscription Card */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-lg dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Subscription</h2>
            {status?.subscription_status && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isActive ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                  : status.subscription_status === "trialing" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : status.subscription_status === "past_due" ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
              }`}>
                {status.subscription_status}
              </span>
            )}
          </div>

          {isActive && periodEnd && (
            <p className="text-sm text-slate-500 dark:text-white/50">
              Next billing date: <span className="text-slate-900 dark:text-white">{periodEnd}</span>
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-white/50">
              <span>Base plan (1 account included)</span>
              <span className="text-slate-900 dark:text-white">${status?.base_price?.toFixed(2)}/mo</span>
            </div>
            {(status?.extra_accounts ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500 dark:text-white/50">
                <span>{status!.extra_accounts} extra account{status!.extra_accounts > 1 ? "s" : ""} × ${status?.extra_account_price?.toFixed(2)}</span>
                <span className="text-slate-900 dark:text-white">${((status?.extra_accounts ?? 0) * (status?.extra_account_price ?? 0)).toFixed(2)}/mo</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t border-slate-200/50 dark:border-white/[0.06] pt-2">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className="text-slate-900 dark:text-white">${status?.monthly_cost?.toFixed(2)}/mo</span>
            </div>
          </div>

          {!isActive && !subClientSecret && (
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
              onClick={handleActivate} disabled={actionLoading}>
              {actionLoading ? "Setting up..." : "Activate Plan — $29.99/mo"}
            </Button>
          )}

          {subClientSecret && (
            <Elements stripe={stripePromise} options={{
              clientSecret: subClientSecret,
              appearance: {
                theme: theme === "dark" ? "night" : "stripe",
                variables: { colorPrimary: "#2563eb", colorBackground: theme === "dark" ? "#111118" : "#ffffff", colorText: theme === "dark" ? "#ffffff" : "#1e293b" },
              },
            }}>
              <SubscriptionForm clientSecret={subClientSecret} onSuccess={() => { setSubClientSecret(null); loadStatus(); }} />
            </Elements>
          )}
        </div>

        {/* Credit Balance Card */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-lg dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Credit Balance</h2>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">${(status?.credit_balance ?? 0).toFixed(2)}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-white/50">
            Credits are used for the 5% commission on paid media sales. A small fee is deducted from your balance each time a fan is charged.
          </p>

          {!topupClientSecret ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[20, 50, 100].map((amt) => (
                  <Button key={amt} variant={topupAmount === amt ? "default" : "outline"} size="sm"
                    className={topupAmount === amt
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                      : "border-slate-200/70 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-white/70"
                    }
                    onClick={() => setTopupAmount(amt)}>
                    ${amt}
                  </Button>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-white/40 text-sm">$</span>
                  <input type="number" min={10} value={topupAmount}
                    onChange={(e) => setTopupAmount(Math.max(10, Number(e.target.value)))}
                    className="w-20 bg-white/50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded px-2 py-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
                onClick={() => handleTopup(topupAmount)} disabled={actionLoading}>
                {actionLoading ? "Setting up..." : `Top Up $${topupAmount.toFixed(2)}`}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-white/50 mb-2">
                <span>Topping up:</span>
                <span className="text-slate-900 dark:text-white font-medium">${topupAmount.toFixed(2)}</span>
              </div>
              <Elements stripe={stripePromise} options={{
                clientSecret: topupClientSecret,
                appearance: {
                  theme: theme === "dark" ? "night" : "stripe",
                  variables: { colorPrimary: "#2563eb", colorBackground: theme === "dark" ? "#111118" : "#ffffff", colorText: theme === "dark" ? "#ffffff" : "#1e293b" },
                },
              }}>
                <TopupForm clientSecret={topupClientSecret} onSuccess={() => { setTopupClientSecret(null); loadStatus(); }} />
              </Elements>
              <Button variant="ghost" size="sm" className="text-slate-400 dark:text-white/40 text-xs" onClick={() => setTopupClientSecret(null)}>Cancel</Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">How Billing Works</h2>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-white/50">
            <li><span className="text-slate-900 dark:text-white font-medium">$29.99/mo</span> — Base subscription includes 1 Telegram account</li>
            <li><span className="text-slate-900 dark:text-white font-medium">$4.99/mo</span> — Each additional Telegram account</li>
            <li><span className="text-slate-900 dark:text-white font-medium">5% commission</span> — Deducted from credit balance on each paid media sale (Stars valued at ~$0.013 each)</li>
            <li>Credits are prepaid — top up your balance before sending paid media</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
