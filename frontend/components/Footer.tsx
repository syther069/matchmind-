"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import WhitepaperModal from "@/components/WhitepaperModal";

export function Footer() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-bg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            MatchMind / X Layer Mainnet
          </p>

          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-sm font-semibold uppercase text-muted">
            <button
              type="button"
              onClick={() => setWhitepaperOpen(true)}
              className="transition duration-200 hover:-translate-y-0.5 hover:text-green focus:outline-none focus:ring-2 focus:ring-green/70"
            >
              Whitepaper
            </button>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <a
              href="https://github.com/syther069"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition duration-200 hover:-translate-y-0.5 hover:text-green focus:outline-none focus:ring-2 focus:ring-green/70"
            >
              <Github size={15} aria-hidden="true" />
              GitHub
            </a>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <a
              href="https://www.oklink.com/xlayer"
              target="_blank"
              rel="noopener noreferrer"
              className="transition duration-200 hover:-translate-y-0.5 hover:text-green focus:outline-none focus:ring-2 focus:ring-green/70"
            >
              Verification
            </a>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <a
              href="mailto:syther069@gmail.com?subject=MatchMind%20Privacy"
              className="transition duration-200 hover:-translate-y-0.5 hover:text-green focus:outline-none focus:ring-2 focus:ring-green/70"
            >
              Privacy
            </a>
          </nav>
        </div>
      </footer>

      <WhitepaperModal
        open={whitepaperOpen}
        onClose={() => setWhitepaperOpen(false)}
      />
    </>
  );
}
