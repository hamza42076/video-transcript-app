"use client";

import { motion } from "framer-motion";
import { AlertTriangle, FileWarning, RefreshCw, ServerCrash, WifiOff } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ApiErrorKind } from "@/lib/types";

const presets: Record<ApiErrorKind, { icon: typeof AlertTriangle; title: string }> = {
  unsupported: { icon: FileWarning, title: "Unsupported file" },
  "too-large": { icon: FileWarning, title: "File too large" },
  network: { icon: WifiOff, title: "Connection problem" },
  upload: { icon: AlertTriangle, title: "Upload failed" },
  processing: { icon: ServerCrash, title: "Transcription failed" },
};

type Props = {
  kind: ApiErrorKind;
  message: string;
  onRetry?: () => void;
  onReset: () => void;
};

export default function ErrorState({ kind, message, onRetry, onReset }: Props) {
  const { icon: Icon, title } = presets[kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      role="alert"
      className="card flex flex-col items-center gap-4 rounded-2xl border-danger/25 px-6 py-12 text-center"
    >
      <motion.span
        initial={{ rotate: -8, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
        className="grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger"
      >
        <Icon className="size-6" aria-hidden />
      </motion.span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted">{message}</p>
      </div>
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="ghost" onClick={onReset}>
          Choose another file
        </Button>
        {onRetry && (
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden />
            Try again
          </Button>
        )}
      </div>
    </motion.div>
  );
}
