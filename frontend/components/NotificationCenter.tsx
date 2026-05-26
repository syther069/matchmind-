"use client";

import { useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMatchMindUser } from "@/lib/userProfile";
import { cn } from "@/lib/utils";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllNotificationsRead } = useMatchMindUser();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-bg1 text-muted transition-colors hover:border-green hover:text-green"
        title="Open notifications"
        aria-label="Open notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-green px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-bg">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-bg1 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="font-mono text-xs uppercase text-green">Notifications</p>
              <h2 className="font-display text-lg font-bold uppercase text-text">Activity center</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={markAllNotificationsRead} title="Mark all read">
                <CheckCheck size={17} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close notifications">
                <X size={17} />
              </Button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-5 text-sm text-muted">No notifications yet. New positions, mints, and profile updates will appear here.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "border-b border-border p-4 last:border-b-0",
                    notification.read ? "bg-bg1" : "bg-[#a8ff6e0f]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-sm font-bold uppercase text-text">{notification.title}</p>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-muted">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line font-mono text-xs uppercase leading-5 text-muted">{notification.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
