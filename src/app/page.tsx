"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthData } from "@/lib/api";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const auth = getAuthData();
    if (auth?.token) {
      router.replace("/inbox");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const faqs = [
    {
      q: "What is Starflow?",
      a: "Starflow is a CRM built for digital creator agencies. It lets you manage multiple Telegram accounts, run your team across dozens of conversations, and sell locked paid media — all from one dashboard.",
    },
    {
      q: "Who is it for?",
      a: "Agencies and independent creators monetizing on Telegram. If you have a team handling DMs across multiple accounts, Starflow was built specifically for you.",
    },
    {
      q: "How does the paid media work?",
      a: "Your team can send locked media directly from the inbox. Fans pay with Telegram Stars. You upload content once to the Vault and reuse it across any conversation — no re-uploading every time.",
    },
    {
      q: "Do I need a Telegram bot?",
      a: "Yes — each account connects its own bot token. Setup takes under 2 minutes via BotFather. The bot handles locked media delivery while your team runs conversations normally.",
    },
    {
      q: "How many accounts can I add?",
      a: "As many as you need. There's no per-account cap on your plan — add all your creators, assign team members, and manage everything from one place.",
    },
    {
      q: "Is my team's access controlled?",
      a: "Yes. Team members only see conversations they're assigned to. Agency admins have full visibility. Role-based access is built in from day one.",
    },
  ];

  const steps = [
    {
      n: "1",
      title: "Create your agency account",
      desc: "Sign up in 2 minutes. No credit card needed to get started.",
    },
    {
      n: "2",
      title: "Add your Telegram accounts",
      desc: "Connect each creator's Telegram account. Each one gets its own session.",
    },
    {
      n: "3",
      title: "Configure bot tokens",
      desc: "Link a bot to each account via BotFather. This enables locked media payments.",
    },
    {
      n: "4",
      title: "Add your team",
      desc: "Invite your team, assign them to accounts, and they're live in the inbox immediately.",
    },
    {
      n: "5",
      title: "Start selling",
      desc: "Upload media to the Vault, send locked content from the inbox, track everything.",
    },
  ];

  const features = [
    {
      icon: "💬",
      title: "Multi-account inbox",
      desc: "All conversations across every creator account in one unified inbox. Switch accounts, filter by unread, search by fan name.",
    },
    {
      icon: "🔒",
      title: "Vault & locked media",
      desc: "Upload once, send to any fan. Media lives on Telegram's servers — no storage costs. Fans pay with Stars, you get paid.",
    },
    {
      icon: "👥",
      title: "Team management",
      desc: "Add your team, assign them to specific accounts, and track who's handling what. Built for agencies with real headcount.",
    },
    {
      icon: "⭐",
      title: "Telegram Stars payments",
      desc: "Native in-chat payments. Fans pay with Apple Pay or Google Pay — no redirects, no friction, higher conversion.",
    },
    {
      icon: "📊",
      title: "Real-time dashboard",
      desc: "See revenue, active conversations, and account status at a glance. Know what's working before the day is over.",
    },
    {
      icon: "🔐",
      title: "Role-based access",
      desc: "Team members see only their assigned accounts. Admins see everything. Security built in, not bolted on.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold">
              S
            </div>
            <span className="font-semibold text-white tracking-tight">Starflow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Built for agencies and creators
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            The Ultimate{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Telegram CRM
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage multiple creator accounts, run your team, and sell locked media — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-gray-400 hover:text-white px-8 py-3.5 rounded-xl font-medium text-base transition-colors border border-white/10 hover:border-white/20"
            >
              Sign in
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No credit card required &nbsp;·&nbsp; Setup in under 5 minutes &nbsp;·&nbsp; Cancel anytime
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f] z-10 pointer-events-none h-full" style={{ background: "linear-gradient(to bottom, transparent 60%, #0a0a0f 100%)" }} />
          <div className="rounded-2xl border border-white/10 bg-[#111118] overflow-hidden shadow-2xl shadow-black/60">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d0d14]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 text-center">
                app.starflowcrm.io/inbox
              </div>
            </div>
            {/* App UI mockup */}
            <div className="flex h-72">
              {/* Sidebar */}
              <div className="w-56 border-r border-white/5 bg-[#0d0d14] p-3 flex flex-col gap-1">
                <div className="text-xs text-gray-500 px-2 py-1 mb-1">Accounts</div>
                {["@creator_1", "@creator_2", "@creator_3", "@creator_4"].map((name, i) => (
                  <div key={name} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs cursor-pointer ${i === 0 ? "bg-blue-600/20 text-blue-300" : "text-gray-400 hover:bg-white/5"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-600" : "bg-white/10"}`}>
                      {name[1].toUpperCase()}
                    </div>
                    {name}
                    {i < 2 && <span className="ml-auto w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">{i === 0 ? "8" : "3"}</span>}
                  </div>
                ))}
              </div>
              {/* Conversations */}
              <div className="w-52 border-r border-white/5 bg-[#0f0f18] p-2 flex flex-col gap-1">
                <div className="text-xs text-gray-500 px-2 py-1 mb-1">Conversations</div>
                {["Jake M.", "Tyler B.", "Alex K.", "Noah R.", "Sam W."].map((name, i) => (
                  <div key={name} className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer ${i === 0 ? "bg-white/5" : ""}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-300 font-medium">{name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{i === 0 ? "send me more 🔥" : i === 1 ? "how much for..." : "hey i want to..."}</div>
                    </div>
                    {i < 3 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                  </div>
                ))}
              </div>
              {/* Chat window */}
              <div className="flex-1 bg-[#0a0a0f] p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="max-w-[60%] bg-white/5 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-300">
                    hey what do you have in your vault? 👀
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="max-w-[60%] bg-blue-600 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white">
                    I have something really special for you 😏 want to see?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="max-w-[60%] bg-white/5 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-300">
                    yes!! send it
                  </div>
                </div>
                {/* Locked media card */}
                <div className="flex gap-2 justify-end">
                  <div className="bg-[#1a1a2e] border border-violet-500/30 rounded-xl px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-violet-300 font-medium mb-1">
                      <span>🔒</span> Locked Media
                    </div>
                    <div className="text-gray-400 text-[10px]">150 ⭐ to unlock</div>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <div className="flex-1 text-xs text-gray-500">Type a message...</div>
                  <div className="text-xs text-blue-400 cursor-pointer">🔒 Vault</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500 mb-6">Built for agencies running on</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
            {["Telegram", "Instagram", "TikTok", "YouTube", "Patreon", "Substack"].map((p) => (
              <span key={p} className="text-sm font-medium hover:text-gray-300 transition-colors">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-blue-400 font-medium mb-3">Features</p>
            <h2 className="text-4xl font-bold mb-4">Everything your agency needs</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Stop juggling multiple tabs and phone logins. Starflow gives your team one place to manage every conversation, every account, every sale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-[#111118] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-blue-400 font-medium mb-3">How it works</p>
            <h2 className="text-4xl font-bold mb-4">Up and running in 5 steps</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From signup to your first locked media sale — guided the whole way.</p>
          </div>
          <div className="flex flex-col gap-4">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-start gap-5 bg-[#111118] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-auto text-gray-600 text-lg self-center">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Starflow vs managing it manually</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Most agencies run on a mess of phone logins, Google Sheets, and Telegram groups. Here&apos;s what changes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Starflow */}
            <div className="bg-[#111118] border border-blue-500/20 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold">S</div>
                <span className="font-semibold text-white">With Starflow</span>
                <span className="ml-auto text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">✓ The right way</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "One dashboard for all accounts",
                  "Team members work without sharing logins",
                  "Upload media once, send to anyone",
                  "Telegram Stars payments built in",
                  "Real-time revenue tracking",
                  "Role-based access per team member",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Manual */}
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-gray-400 text-sm">📱</span>
                <span className="font-semibold text-gray-400">Manual / ad hoc</span>
                <span className="ml-auto text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">The old way</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Shared phone logins, security risk",
                  "Team members lose context switching accounts",
                  "Re-upload media for every fan",
                  "No payment tracking at all",
                  "Revenue updates via DM or spreadsheet",
                  "No access control, anyone sees everything",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-red-500/60 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-blue-400 font-medium mb-3">Pricing</p>
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Pay for what you use. Base plan covers your first account — add more as you grow.</p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-8">
            {/* Base plan */}
            <div className="bg-[#111118] border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              <p className="text-sm text-gray-400 mb-1">Agency plan</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white">$29.99</span>
                <span className="text-gray-500 text-sm mb-1">/ mo</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Includes 1 Telegram account</p>
              <div className="flex flex-col gap-2">
                {["Full inbox & conversation management", "Vault — upload once, send anywhere", "Team management", "Role-based access control"].map(i => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {i}
                  </div>
                ))}
              </div>
            </div>
            {/* Extra accounts */}
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-1">Extra accounts</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white">$4.99</span>
                <span className="text-gray-500 text-sm mb-1">/ account / mo</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Each additional Telegram account beyond the first</p>
              <div className="bg-white/3 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                <div className="flex justify-between"><span>1 account</span><span className="text-white">$29.99/mo</span></div>
                <div className="flex justify-between"><span>5 accounts</span><span className="text-white">$49.95/mo</span></div>
                <div className="flex justify-between"><span>10 accounts</span><span className="text-white">$74.90/mo</span></div>
                <div className="flex justify-between"><span>25 accounts</span><span className="text-white">$149.75/mo</span></div>
              </div>
            </div>
            {/* Commission */}
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-1">Sales commission</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white">5%</span>
                <span className="text-gray-500 text-sm mb-1">of sales</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Deducted from your credit balance</p>
              <div className="flex flex-col gap-2 text-xs text-gray-400">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Monthly fee credited to your balance
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Auto-deducted per sale — no extra setup
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Stars go directly to your bot
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Top up anytime if balance runs low
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-medium mb-1">Ready to get started?</p>
                <p className="text-sm text-gray-400">Free to sign up. No credit card required until you activate.</p>
              </div>
              <Link href="/signup" className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-blue-400 font-medium mb-3">FAQ</p>
            <h2 className="text-4xl font-bold mb-4">Questions we get asked</h2>
            <p className="text-gray-400">Everything you need to know before getting started.</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-4 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#0d0d14]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative bg-[#111118] border border-white/10 rounded-3xl px-8 py-16">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                S
              </div>
              <h2 className="text-4xl font-bold mb-4">Ready to run your agency properly?</h2>
              <p className="text-gray-400 mb-10 max-w-xl mx-auto">Stop patching together phone logins and spreadsheets. Give your team the tools they need to actually sell at scale.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20">
                  Get started free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
              <p className="text-gray-600 text-sm mt-4">No credit card required · Setup in under 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold">
                  S
                </div>
                <span className="font-semibold text-white">Starflow</span>
              </div>
              <p className="text-sm text-gray-500">The CRM for creator agencies managing Telegram accounts at scale.</p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="text-sm font-medium text-white mb-3">Product</p>
                <div className="flex flex-col gap-2">
                  <a href="#features" className="text-sm text-gray-500 hover:text-white transition-colors">Features</a>
                  <a href="#pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</a>
                  <a href="#how-it-works" className="text-sm text-gray-500 hover:text-white transition-colors">How it works</a>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-3">Account</p>
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">Login</Link>
                  <Link href="/signup" className="text-sm text-gray-500 hover:text-white transition-colors">Sign up</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">© 2026 Starflow. All rights reserved.</p>
            <p className="text-xs text-gray-700">Built for agencies. Powered by Telegram.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
