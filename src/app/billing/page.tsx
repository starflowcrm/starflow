"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? "Processing..." : "Top Up Credits"}
      </Button>
    </form>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<ReturnType<typeof getAuthData>>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subClientSecret, setSubClientSecret] = useState<string | null>(null);
  const [topupClientSecret, setTopupClientSecret] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(20);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authData = getAuthData();
    if (!authData?.token) {
      router.replace("/login");
      return;
    }
    if (authData.role !== "agency") {
      router.replace("/inbox");
      return;
    }
    setAuth(authData);
  }, [router]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await billingApi.status();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth) loadStatus();
  }, [auth, loadStatus]);

  const handleActivate = async () => {
    setActionLoading(true);
    setError("");
    try {
      const { clientSecret } = await billingApi.createSubscription();
      setSubClientSecret(clientSecret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTopup = async (amount: number) => {
    setActionLoading(true);
    setError("");
    setTopupAmount(amount);
    try {
      const { clientSecret } = await billingApi.topup(amount);
      setTopupClientSecret(clientSecret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create top-up");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-pulse text-muted-foreground">Loading billing...</div>
      </div>
    );
  }

  const isActive = status?.subscription_status === "active";
  const periodEnd = status?.subscription_current_period_end
    ? new Date(status.subscription_current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e0e]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Starflow
          </span>
          <nav className="flex items-center gap-1">
            <Link href="/inbox">
              <Button variant="ghost" size="sm" className="text-xs h-8">Inbox</Button>
            </Link>
            <Link href="/accounts">
              <Button variant="ghost" size="sm" className="text-xs h-8">Accounts</Button>
            </Link>
            <Link href="/chatters">
              <Button variant="ghost" size="sm" className="text-xs h-8">Chatters</Button>
            </Link>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="text-white text-xs h-8">Billing</Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{auth?.name}</span>
          <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
            {auth?.role}
          </span>
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Subscription Card */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Subscription</h2>
            {status?.subscription_status && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isActive
                    ? "bg-green-500/10 text-green-400"
                    : status.subscription_status === "trialing"
                    ? "bg-blue-500/10 text-blue-400"
                    : status.subscription_status === "past_due"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {status.subscription_status}
              </span>
            )}
          </div>

          {isActive && periodEnd && (
            <p className="text-sm text-muted-foreground">
              Next billing date: <span className="text-white">{periodEnd}</span>
            </p>
          )}

          {/* Cost breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Base plan (1 account included)</span>
              <span className="text-white">${status?.base_price?.toFixed(2)}/mo</span>
            </div>
            {(status?.extra_accounts ?? 0) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {status!.extra_accounts} extra account{status!.extra_accounts > 1 ? "s" : ""} × $
                  {status?.extra_account_price?.toFixed(2)}
                </span>
                <span className="text-white">
                  ${((status?.extra_accounts ?? 0) * (status?.extra_account_price ?? 0)).toFixed(2)}/mo
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t border-white/[0.06] pt-2">
              <span className="text-white">Total</span>
              <span className="text-white">${status?.monthly_cost?.toFixed(2)}/mo</span>
            </div>
          </div>

          {!isActive && !subClientSecret && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleActivate}
              disabled={actionLoading}
            >
              {actionLoading ? "Setting up..." : "Activate Plan — $29.99/mo"}
            </Button>
          )}

          {subClientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: subClientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#2563eb",
                    colorBackground: "#111118",
                    colorText: "#ffffff",
                  },
                },
              }}
            >
              <SubscriptionForm
                clientSecret={subClientSecret}
                onSuccess={() => {
                  setSubClientSecret(null);
                  loadStatus();
                }}
              />
            </Elements>
          )}
        </div>

        {/* Credit Balance Card */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Credit Balance</h2>
            <span className="text-2xl font-bold text-white">
              ${(status?.credit_balance ?? 0).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Credits are used for the 5% commission on paid media sales. A small fee is deducted from
            your balance each time a fan is charged.
          </p>

          {!topupClientSecret ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[20, 50, 100].map((amt) => (
                  <Button
                    key={amt}
                    variant={topupAmount === amt ? "default" : "outline"}
                    size="sm"
                    className={
                      topupAmount === amt
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-white/10 hover:bg-white/5"
                    }
                    onClick={() => setTopupAmount(amt)}
                  >
                    ${amt}
                  </Button>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    min={10}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Math.max(10, Number(e.target.value)))}
                    className="w-20 bg-[#0a0a0f] border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleTopup(topupAmount)}
                disabled={actionLoading}
              >
                {actionLoading ? "Setting up..." : `Top Up $${topupAmount.toFixed(2)}`}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Topping up:</span>
                <span className="text-white font-medium">${topupAmount.toFixed(2)}</span>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: topupClientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#2563eb",
                      colorBackground: "#111118",
                      colorText: "#ffffff",
                    },
                  },
                }}
              >
                <TopupForm
                  clientSecret={topupClientSecret}
                  onSuccess={() => {
                    setTopupClientSecret(null);
                    loadStatus();
                  }}
                />
              </Elements>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={() => setTopupClientSecret(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">How Billing Works</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="text-white font-medium">$29.99/mo</span> — Base subscription includes 1 Telegram account
            </li>
            <li>
              <span className="text-white font-medium">$4.99/mo</span> — Each additional Telegram account
            </li>
            <li>
              <span className="text-white font-medium">5% commission</span> — Deducted from credit balance on each paid media sale (Stars valued at ~$0.013 each)
            </li>
            <li>
              Credits are prepaid — top up your balance before sending paid media
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
