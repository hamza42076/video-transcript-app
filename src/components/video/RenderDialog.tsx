"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import Button from "@/components/ui/Button";
import Waveform from "@/components/ui/Waveform";

type Props = {
  open: boolean;
  progress: number; // 0–1
  filename: string;
  onCancel: () => void;
};

// Progress UI while the captioned video is being recorded in the browser.
export default function RenderDialog({ open, progress, filename, onCancel }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="render-title"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="card w-full max-w-sm rounded-2xl bg-surface p-6 text-center"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent-soft">
              <Clapperboard className="size-6" aria-hidden />
            </span>
            <h2 id="render-title" className="mt-4 text-lg font-semibold">
              Rendering captions…
            </h2>
            <p className="mt-1 truncate text-xs text-subtle" title={filename}>
              {filename}
            </p>

            <Waveform bars={24} className="mt-5 h-8" />

            <div
              className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-white/6"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-200 ease-linear"
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <p className="mt-2 font-mono text-xs tabular-nums text-muted">{pct}%</p>

            <p className="mt-4 text-xs leading-5 text-subtle">
              This plays the video once in the background and records it with captions — it takes about as long as
              the video itself. Keep this tab open and visible.
            </p>

            <Button type="button" variant="ghost" onClick={onCancel} className="mt-4">
              Cancel
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
