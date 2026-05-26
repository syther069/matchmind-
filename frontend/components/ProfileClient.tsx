"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, IdCard, Save, ShieldCheck, Wallet } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RecentActivity } from "@/components/RecentActivity";
import { UserAvatar } from "@/components/UserAvatar";
import { useMatchMindUser } from "@/lib/userProfile";
import { xLayer } from "@/lib/chains";
import { shortAddress } from "@/lib/utils";

function statValue(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function ProfileClient() {
  const { profile, updateProfile, mintPredictionPass } = useMatchMindUser();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);

  useEffect(() => {
    setUsername(profile.username);
    setAvatar(profile.avatar);
  }, [profile.avatar, profile.username]);

  const stats = useMemo(() => {
    const followed = profile.positions.filter((position) => position.side === "FOLLOW").length;
    const faded = profile.positions.filter((position) => position.side === "FADE").length;
    const total = profile.positions.length;
    const accuracy = total === 0 ? 0 : Math.min(92, 55 + total * 7);
    return { followed, faded, total, accuracy };
  }, [profile.positions]);

  const network = isConnected
    ? chainId === xLayer.id
      ? "X Layer Mainnet (196)"
      : `Unsupported network (${chainId})`
    : "Wallet not connected";

  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-sm uppercase text-green">Trader profile</p>
          <h1 className="font-display text-4xl font-bold uppercase text-text">Identity, wallet, activity</h1>
        </div>
        <div className="rounded-md border border-border bg-bg1 px-3 py-2 font-mono text-xs uppercase text-muted">
          Local-first profile / on-chain ready
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase text-muted">Username and avatar</p>
            <h2 className="font-display text-2xl font-bold uppercase text-text">Profile settings</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <UserAvatar src={avatar} username={username} size="lg" />
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-bg2 px-3 font-display text-sm font-semibold uppercase text-text transition-colors hover:border-green hover:text-green">
                <Camera size={16} />
                Upload Image
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
              </label>
            </div>

            <label className="block">
              <span className="font-mono text-xs uppercase text-muted">Custom username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-border bg-bg px-3 font-mono text-sm text-text outline-none transition-colors focus:border-green"
                placeholder="MatchMind Trader"
              />
            </label>

            <Button onClick={() => updateProfile({ username, avatar })} className="w-full justify-center">
              <Save size={16} />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase text-muted">Wallet information</p>
            <h2 className="font-display text-2xl font-bold uppercase text-text">X Layer identity</h2>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Wallet} label="Connected wallet" value={isConnected && address ? address : "Not connected"} />
            <InfoRow icon={IdCard} label="Short address" value={isConnected && address ? shortAddress(address) : "--"} />
            <InfoRow icon={ShieldCheck} label="Network" value={network} />
            <InfoRow
              icon={BadgeCheck}
              label="Prediction Pass"
              value={profile.predictionPassMinted ? "Owned" : "Not minted"}
              tone={profile.predictionPassMinted ? "text-green" : "text-muted"}
            />
            <InfoRow icon={IdCard} label="Total positions recorded" value={statValue(stats.total)} />
            <Button
              variant={profile.predictionPassMinted ? "secondary" : "default"}
              disabled={profile.predictionPassMinted}
              onClick={mintPredictionPass}
              className="justify-center"
            >
              <BadgeCheck size={16} />
              {profile.predictionPassMinted ? "Pass Active" : "Mint Demo Pass"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Markets Followed" value={statValue(stats.followed)} />
        <Stat label="Markets Faded" value={statValue(stats.faded)} />
        <Stat label="Total Positions" value={statValue(stats.total)} />
        <Stat label="Prediction Accuracy" value={stats.total === 0 ? "0%" : `${stats.accuracy}%`} />
        <Stat label="Prediction Pass Status" value={profile.predictionPassMinted ? "Owned" : "Open"} />
      </section>

      <RecentActivity limit={8} />
    </main>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  tone = "text-text"
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-bg p-3">
      <p className="flex items-center gap-2 font-mono text-xs uppercase text-muted">
        <Icon size={14} /> {label}
      </p>
      <p className={`mt-2 break-all font-mono text-sm ${tone}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg1 p-4">
      <p className="font-mono text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold uppercase text-text">{value}</p>
    </div>
  );
}
