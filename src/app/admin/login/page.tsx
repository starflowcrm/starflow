"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAuthApi, setAdminToken } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminAuthApi.login(secret);
      setAdminToken(data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111118] border border-white/10 rounded-xl p-8 w-full max-w-sm space-y-5"
      >
        <div className="text-center">
          <h1 className="text-white text-xl font-bold">Starflow Admin</h1>
          <p className="text-white/40 text-sm mt-1">Enter admin secret to continue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret key"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          autoFocus
        />

        <button
          type="submit"
          disabled={loading || !secret}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? "Authenticating..." : "Enter Admin Panel"}
        </button>
      </form>
    </div>
  );
}
