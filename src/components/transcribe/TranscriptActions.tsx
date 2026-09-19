"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Captions, Check, ChevronDown, Clapperboard, Copy, Download, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import RenderDialog from "@/components/video/RenderDialog";
import { stripExtension } from "@/lib/format";
import { renderCaptionedVideo, supportedOutput } from "@/lib/render-captions";
import { toSrt } from "@/lib/subtitles";
import type { Segment } from "@/lib/types";

type Props = {
  transcript: string;
  filename: string;
  /** Enables the SRT and captioned-video downloads when present. */
  segments?: Segment[];
  /** Enables the captioned-video download when present. */
  videoUrl?: string;
  className?: string;
};

// Browser capability is static; cache it so useSyncExternalStore gets a stable snapshot.
// Server snapshot is null so SSR and the first client render match (no hydration mismatch).
let cachedOutput: ReturnType<typeof supportedOutput> | undefined;
const subscribeNoop = () => () => {};
const getOutput = () => (cachedOutput === undefined ? (cachedOutput = supportedOutput()) : cachedOutput);
const getServerOutput = () => null;

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Copy + Download menu — shared by the reader and the video detail view.
export default function TranscriptActions({ transcript, filename, segments, videoUrl, className = "" }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const base = stripExtension(filename) || "transcript";
  const hasSegments = (segments?.length ?? 0) > 0;
  const output = useSyncExternalStore(subscribeNoop, getOutput, getServerOutput);
  const canRender = Boolean(videoUrl && hasSegments && output);

  // Close the menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
    setMenuOpen(false);
    saveBlob(new Blob([transcript], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
    toast({ kind: "success", title: "Download started", description: `${base}.txt` });
  }

  function downloadSrt() {
    setMenuOpen(false);
    if (!segments) return;
    saveBlob(new Blob([toSrt(segments)], { type: "application/x-subrip;charset=utf-8" }), `${base}.srt`);
    toast({ kind: "success", title: "Download started", description: `${base}.srt` });
  }

  async function downloadCaptionedVideo() {
    setMenuOpen(false);
    if (!videoUrl || !segments) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRenderProgress(0);
    setRendering(true);
    try {
      const { blob, ext } = await renderCaptionedVideo({
        src: videoUrl,
        segments,
        signal: controller.signal,
        onProgress: setRenderProgress,
      });
      const name = `${base}-captions.${ext}`;
      saveBlob(blob, name);
      toast({ kind: "success", title: "Video ready", description: name });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast({ kind: "info", title: "Render cancelled" });
      } else {
        toast({
          kind: "error",
          title: "Couldn't render the video",
          description: e instanceof Error ? e.message : undefined,
        });
      }
    } finally {
      setRendering(false);
      abortRef.current = null;
    }
  }

  type ItemKey = "txt" | "srt" | "video";
  const items: { key: ItemKey; icon: typeof FileText; label: string; hint: string }[] = [
    { key: "txt", icon: FileText, label: "Transcript", hint: ".txt" },
    ...(hasSegments ? [{ key: "srt" as const, icon: Captions, label: "Subtitles", hint: ".srt" }] : []),
    ...(canRender
      ? [{ key: "video" as const, icon: Clapperboard, label: "Video with captions", hint: output ? `.${output.ext}` : "" }]
      : []),
  ];

  function pick(key: ItemKey) {
    if (key === "txt") downloadTxt();
    else if (key === "srt") downloadSrt();
    else void downloadCaptionedVideo();
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

      {items.length === 1 ? (
        <Button type="button" variant="secondary" size="sm" onClick={downloadTxt} className="flex-1 sm:flex-none">
          <Download className="size-4" aria-hidden />
          Download TXT
        </Button>
      ) : (
        <div ref={menuRef} className="relative flex-1 sm:flex-none">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="w-full"
          >
            <Download className="size-4" aria-hidden />
            Download
            <ChevronDown className={`size-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
          </Button>

          <AnimatePresence>
            {menuOpen && (
              <motion.ul
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="glass absolute right-0 z-30 mt-2 w-60 rounded-xl p-1.5 shadow-card"
              >
                {items.map((item) => (
                  <li key={item.key} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => pick(item.key)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-white/6"
                    >
                      <item.icon className="size-4 shrink-0 text-accent-soft" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      <span className="font-mono text-[11px] text-subtle">{item.hint}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      <RenderDialog
        open={rendering}
        progress={renderProgress}
        filename={filename}
        onCancel={() => abortRef.current?.abort()}
      />
    </div>
  );
}
