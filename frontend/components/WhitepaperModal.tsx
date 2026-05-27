"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, X } from "lucide-react";

type WhitepaperModalProps = {
  open: boolean;
  onClose: () => void;
};

const sectionClassName = "space-y-3 border-t border-white/[0.07] pt-5";
const headingClassName = "font-mono text-xs font-semibold uppercase tracking-[0.18em] text-green";
const paragraphClassName = "text-sm leading-7 text-[#d8d4ca] sm:text-base";
const listClassName = "space-y-2 text-sm leading-7 text-[#d8d4ca] sm:text-base";

export default function WhitepaperModal({ open, onClose }: WhitepaperModalProps) {
  const titleId = useId();
  const abstractId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;

      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={abstractId}
            className="relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c0d0d]/95 shadow-[0_30px_120px_rgba(0,0,0,0.65)] ring-1 ring-green/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green/70 to-transparent" />
            <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-green/10 blur-3xl" />
            <div className="flex items-start justify-between gap-5 border-b border-white/[0.07] px-5 py-5 sm:px-8">
              <div className="min-w-0 space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-green">
                  MatchMind Whitepaper v1.0
                </p>
                <h2 id={titleId} className="font-display text-2xl font-bold uppercase leading-tight text-text sm:text-4xl">
                  AI-Powered Prediction Markets on X Layer
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-muted transition duration-200 hover:border-green/60 hover:bg-green/10 hover:text-green focus:outline-none focus:ring-2 focus:ring-green/70"
                aria-label="Close whitepaper modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-8">
              <div className="space-y-7">
                <section className="space-y-3">
                  <h3 className={headingClassName}>ABSTRACT</h3>
                  <p id={abstractId} className={paragraphClassName}>
                    MatchMind is an AI prediction agent that commits football predictions to X Layer before kickoff, creating a permanent and verifiable on-chain track record. Users can stake OKB to follow or fade the agent's predictions in a transparent prediction market.
                  </p>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>PROBLEM</h3>
                  <p className={paragraphClassName}>Traditional prediction platforms rely on trust:</p>
                  <ul className={listClassName}>
                    <li>• Predictions can be edited after events occur</li>
                    <li>• Centralized operators control odds and payouts</li>
                    <li>• Users cannot independently verify prediction history</li>
                  </ul>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>SOLUTION</h3>
                  <p className={paragraphClassName}>MatchMind records every AI prediction on X Layer before kickoff.</p>
                  <p className={paragraphClassName}>Each prediction includes:</p>
                  <ul className={listClassName}>
                    <li>• Match outcome prediction</li>
                    <li>• Confidence score</li>
                    <li>• AI reasoning stored on IPFS</li>
                  </ul>
                  <p className={paragraphClassName}>Once committed, predictions cannot be altered or backdated.</p>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>HOW IT WORKS</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <h4 className="font-display text-base font-semibold uppercase text-text">1. AI Analysis</h4>
                      <p className="mt-2 text-sm leading-6 text-muted">The agent analyzes:</p>
                      <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#d8d4ca]">
                        <li>- Team form</li>
                        <li>- Head-to-head records</li>
                        <li>- Injuries</li>
                        <li>- Market odds</li>
                      </ul>
                    </article>
                    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <h4 className="font-display text-base font-semibold uppercase text-text">2. On-Chain Commitment</h4>
                      <p className="mt-2 text-sm leading-6 text-[#d8d4ca]">
                        Predictions are stored through the PredictionRegistry contract before kickoff.
                      </p>
                    </article>
                    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <h4 className="font-display text-base font-semibold uppercase text-text">3. Market Opens</h4>
                      <p className="mt-2 text-sm leading-6 text-muted">Users stake OKB on:</p>
                      <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#d8d4ca]">
                        <li>- Follow → AI is correct</li>
                        <li>- Fade → AI is wrong</li>
                      </ul>
                    </article>
                    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <h4 className="font-display text-base font-semibold uppercase text-text">4. Resolution</h4>
                      <p className="mt-2 text-sm leading-6 text-[#d8d4ca]">
                        Results are verified and payouts are distributed automatically through smart contracts.
                      </p>
                    </article>
                  </div>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>CORE CONTRACTS</h3>
                  <div className="grid gap-2 text-sm leading-7 text-[#d8d4ca]">
                    <p className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                      PredictionRegistry — Stores predictions
                    </p>
                    <p className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                      StakingPool — Manages stakes
                    </p>
                    <p className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                      OracleResolver — Resolves markets
                    </p>
                  </div>
                  <p className={paragraphClassName}>Network: X Layer Mainnet (Chain ID 196)</p>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>TECHNOLOGY STACK</h3>
                  <ul className="grid gap-2 text-sm leading-6 text-[#d8d4ca] sm:grid-cols-2 md:grid-cols-3">
                    {["X Layer Mainnet", "Solidity", "Hardhat", "Next.js", "Wagmi", "Viem", "Claude AI", "Pinata/IPFS"].map((item) => (
                      <li key={item} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                        - {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={sectionClassName}>
                  <h3 className={headingClassName}>VISION</h3>
                  <p className={paragraphClassName}>MatchMind combines AI accountability with blockchain transparency.</p>
                  <p className={paragraphClassName}>Every prediction is:</p>
                  <ul className="grid gap-2 text-sm leading-6 text-[#d8d4ca] sm:grid-cols-2">
                    <li className="rounded-xl border border-green/15 bg-green/[0.06] px-3 py-2">✅ Public</li>
                    <li className="rounded-xl border border-green/15 bg-green/[0.06] px-3 py-2">✅ Timestamped</li>
                    <li className="rounded-xl border border-green/15 bg-green/[0.06] px-3 py-2">✅ Verifiable</li>
                    <li className="rounded-xl border border-green/15 bg-green/[0.06] px-3 py-2">✅ Immutable</li>
                  </ul>
                  <div className="space-y-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm leading-7 text-[#d8d4ca]">
                    <p>Built for X Cup Hackathon 2026</p>
                    <p>Powered by X Layer</p>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/[0.07] bg-white/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Built by Syther</p>
              <a
                href="https://github.com/syther069"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green via-[#d5ff81] to-[#6eb8ff] px-5 font-display text-sm font-bold uppercase text-[#071007] shadow-[0_12px_32px_rgba(168,255,110,0.2)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(168,255,110,0.28)] focus:outline-none focus:ring-2 focus:ring-green/70 focus:ring-offset-2 focus:ring-offset-[#0c0d0d]"
              >
                <Github size={17} aria-hidden="true" />
                View GitHub
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
