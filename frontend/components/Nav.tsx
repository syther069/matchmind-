"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bot, ListTree, Trophy } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

const links = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/prediction", label: "Feed", icon: ListTree },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[260px_1fr_auto] lg:items-center">
        <Link href="/" className="flex items-center gap-3" aria-label="MatchMind dashboard">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-green">
            <Bot size={20} />
          </span>
          <span>
            <span className="block font-display text-xl font-bold uppercase text-text">MatchMind</span>
            <span className="block font-mono text-xs uppercase text-muted">X Layer / chain 196</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 lg:justify-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 font-display text-sm font-semibold uppercase transition-colors ${
                pathname === link.href
                  ? "border-green bg-[#a8ff6e1a] text-green"
                  : "border-border bg-transparent text-muted hover:border-green hover:bg-white/[0.04] hover:text-text"
              }`}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex justify-start lg:justify-end">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
