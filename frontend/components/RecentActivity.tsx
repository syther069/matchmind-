"use client";

import { Clock3 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useMatchMindUser } from "@/lib/userProfile";

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function RecentActivity({ limit = 6 }: { limit?: number }) {
  const { activity, profile } = useMatchMindUser();
  const items = activity.slice(0, limit);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold uppercase text-text">Recent Activity</h2>
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted">
          <Clock3 size={14} /> Newest first
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-bg1">
        {items.length === 0 ? (
          <div className="p-6 text-sm text-muted">Activity will appear after positions, mints, and profile updates.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-border p-4 last:border-b-0">
              <UserAvatar src={profile.avatar} username={profile.username} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold uppercase text-text">{item.label}</p>
                  <span className="font-mono text-[10px] uppercase text-muted">{relativeTime(item.createdAt)}</span>
                </div>
                <p className="mt-1 truncate font-mono text-xs uppercase text-muted">{item.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
