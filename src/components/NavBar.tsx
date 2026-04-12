"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface NavBarProps {
  auth?: { name: string; role: string } | null;
  onLogout?: () => void;
  activePath?: string;
}

export function NavBar({ auth, onLogout, activePath }: NavBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAgency = auth?.role === "agency";

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 shadow-sm dark:shadow-none">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent select-none">
          Starflow
        </span>
        {auth && (
          <nav className="flex items-center gap-1">
            <Link href="/inbox">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs h-8 transition-all ${
                  activePath === "/inbox"
                    ? "text-slate-900 dark:text-white bg-black/5 dark:bg-white/10"
                    : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                Inbox
              </Button>
            </Link>
            {isAgency && (
              <>
                <Link href="/accounts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-8 transition-all ${
                      activePath === "/accounts"
                        ? "text-slate-900 dark:text-white bg-black/5 dark:bg-white/10"
                        : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Accounts
                  </Button>
                </Link>
                <Link href="/chatters">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-8 transition-all ${
                      activePath === "/chatters"
                        ? "text-slate-900 dark:text-white bg-black/5 dark:bg-white/10"
                        : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Chatters
                  </Button>
                </Link>
                <Link href="/billing">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs h-8 transition-all ${
                      activePath === "/billing"
                        ? "text-slate-900 dark:text-white bg-black/5 dark:bg-white/10"
                        : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    Billing
                  </Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>

      {/* Right: Theme toggle + User info + Logout */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        )}

        {auth && (
          <>
            <span className="text-xs text-slate-500 dark:text-white/50 hidden sm:block">
              {auth.name}
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-medium hidden sm:block">
              {auth.role}
            </span>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                onClick={onLogout}
              >
                Logout
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
