"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useMatchMindUser } from "@/lib/userProfile";

export function NotificationToasts() {
  const { toasts, dismissToast } = useMatchMindUser();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) => window.setTimeout(() => dismissToast(toast.id), 5000));
    return () => timers.forEach(window.clearTimeout);
  }, [dismissToast, toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-lg border border-green bg-bg1 p-4 shadow-2xl animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold uppercase text-green">{toast.title}</p>
              <p className="mt-2 whitespace-pre-line font-mono text-xs uppercase leading-5 text-muted">{toast.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-muted transition-colors hover:text-text"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
