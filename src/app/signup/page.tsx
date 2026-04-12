"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, setAuthData } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.signup({ name, email, password });
      setAuthData(data);
      router.push("/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="blob blob-1 w-72 h-72 bg-indigo-500 top-10 right-20" />
      <div className="blob blob-2 w-96 h-96 bg-blue-500 bottom-0 -left-10" />
      <div className="blob blob-3 w-64 h-64 bg-violet-500 top-1/2 right-1/4" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Starflow
            </div>
            <p className="text-sm text-slate-500 dark:text-white/50">
              Create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-400/10 p-3 rounded-lg border border-red-200 dark:border-red-400/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-white/70">Agency Name</Label>
              <Input
                id="name"
                placeholder="Your Agency"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10 backdrop-blur-sm focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10 backdrop-blur-sm focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-white/70">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-white/5 border-slate-200/70 dark:border-white/10 backdrop-blur-sm focus:border-blue-400 dark:focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 dark:text-white/50 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
