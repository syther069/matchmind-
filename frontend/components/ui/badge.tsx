import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-bg2 px-2 py-1 font-mono text-xs uppercase text-muted",
        className
      )}
      {...props}
    />
  );
}
