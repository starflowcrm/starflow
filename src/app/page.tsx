"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthData } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthData();
    if (auth?.token) {
      router.replace("/inbox");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
