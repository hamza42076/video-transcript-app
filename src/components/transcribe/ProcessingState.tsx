"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, FileSearch, Sparkles } from "lucide-react";
import Waveform from "@/components/ui/Waveform";

// Labels only — the backend gives no real progress, so this is purely
// an indeterminate indicator that cycles through descriptive phases.
const PHASES = [
  { icon: FileSearch, label: "Analyzing your video…" },
  { icon: AudioLines, label: "Extracting audio…" },
  { icon: Sparkles, label: "Generating transcript…" },
];

export default function ProcessingState({ filename }: { filename: string }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1));
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const Icon = PHASES[phase].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      className="card relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:py-20"
    >
      {/* Animated gradient wash */}
      <div
        aria-hidden
        className="animate-gradient absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(120deg, rgba(139,92,246,0.12), rgba(96,165,250,0.08), rgba(139,92,246,0.12))",
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* AI orb */}
        <div className="relative mb-8 grid size-24 place-items-center">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent/30" aria-hidden />
          <span
            className="animate-pulse-ring absolute inset-0 rounded-full bg-accent-2/25"
            style={{ animationDelay: "0.7s" }}
            aria-hidden
          />
          <span className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 shadow-glow">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={phase}
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
                transition={{ duration: 0.3 }}
                className="grid"
              >
                <Icon className="size-8 text-white" aria-hidden />
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <Waveform bars={32} className="mb-8 h-12 w-full max-w-sm" />

        <div className="h-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium sm:text-xl"
            >
              {PHASES[phase].label}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-1 max-w-sm truncate text-sm text-subtle" title={filename}>
          {filename}
        </p>

        {/* Indeterminate progress bar */}
        <div
          className="relative mt-8 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/6"
          aria-hidden
        >
          <span className="animate-shimmer absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-accent-soft to-transparent" />
        </div>

        {/* Phase dots */}
        <ol className="mt-6 flex items-center gap-2" aria-label="Processing phases">
          {PHASES.map((p, i) => (
            <li
              key={p.label}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= phase ? "w-6 bg-accent-soft" : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </ol>

        <p className="mt-6 text-xs text-subtle">
          This can take a little while for longer videos. Keep this tab open.
        </p>
      </div>
    </motion.div>
  );
}
