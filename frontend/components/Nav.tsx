"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Bot, ListTree, Trophy, User } from "lucide-react";
import { NetworkBadge } from "@/components/NetworkBadge";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useMatchMindUser } from "@/lib/userProfile";
import { WalletConnect } from "./WalletConnect";

const links = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/prediction", label: "Feed", icon: ListTree },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User }
];

export function Nav() {
  const pathname = usePathname();
  const { profile } = useMatchMindUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="MatchMind dashboard">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border text-green">
              <Bot size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-bold uppercase text-text">MatchMind</span>
              <span className="block truncate font-mono text-xs uppercase text-muted">X Layer / chain 196</span>
            </span>
          </Link>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            <Link
              href="/profile"
              className="inline-flex h-10 min-w-0 max-w-[230px] items-center gap-2 rounded-md border border-border bg-bg1 px-2 pr-3 transition-colors hover:border-green"
              title="Open profile"
            >
              <UserAvatar src={profile.avatar} username={profile.username} size="sm" />
              <span className="truncate font-mono text-xs uppercase text-text">{profile.username}</span>
            </Link>
            <NetworkBadge />
            <NotificationCenter />
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
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
      </div>
    </header>
  );
}
