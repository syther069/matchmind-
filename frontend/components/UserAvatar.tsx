"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string;
  username?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl"
};

export function UserAvatar({ src, username = "User", size = "md", className }: Props) {
  const initials = username
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-bg2 font-display font-bold uppercase text-green",
        sizes[size],
        className
      )}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials || <User size={16} />}
    </span>
  );
}
