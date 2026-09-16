"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { stripExtension } from "@/lib/format";

type Props = {
  transcript: string;
  filename: string;
  className?: string;
};

// Copy + Download TXT — shared by the reader and the video detail view.
export default function TranscriptActions({ transcript, filename, className = "" }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      toast({ kind: "success", title: "Transcript copied to clipboard" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ kind: "error", title: "Couldn't copy", description: "Your browser blocked clipboard access." });
    }
  }

  function downloadTxt() {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stripExtension(filename) || "transcript"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ kind: "success", title: "Download started", description: a.download });
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={copy}
        className={`flex-1 sm:flex-none ${copied ? "border-success/40 text-success" : ""}`}
        aria-live="polite"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "done" : "copy"}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </motion.span>
        </AnimatePresence>
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={downloadTxt} className="flex-1 sm:flex-none">
        <Download className="size-4" aria-hidden />
        Download TXT
      </Button>
    </div>
  );
}
