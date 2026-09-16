"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, Calendar, ChevronDown, ChevronUp, Clock3, FileVideo, Search, X } from "lucide-react";
import TranscriptActions from "./TranscriptActions";
import { formatDate, formatDuration, wordCount } from "@/lib/format";

type Props = {
  filename: string;
  transcript: string;
  createdAt?: string;
  /** Client-side duration read from the media element, if we had one. */
  durationSeconds?: number | null;
  /** Optional slot for actions such as "New transcript". */
  actions?: React.ReactNode;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Render paragraphs with <mark> highlights; a running global index marks the "current" hit.
function renderParagraphs(paragraphs: string[], regex: RegExp | null, current: number) {
  if (!regex) return paragraphs.map((p, pi) => <p key={pi}>{p}</p>);

  let matchIndex = 0;
  const out: React.ReactNode[] = [];
  for (let pi = 0; pi < paragraphs.length; pi++) {
    const p = paragraphs[pi];
    const nodes: React.ReactNode[] = [];
    let last = 0;
    for (const m of p.matchAll(regex)) {
      const start = m.index ?? 0;
      if (start > last) nodes.push(p.slice(last, start));
      nodes.push(
        <mark key={`${pi}-${start}`} className={`hit ${matchIndex === current ? "hit-current" : ""}`}>
          {m[0]}
        </mark>,
      );
      matchIndex += 1;
      last = start + m[0].length;
    }
    if (last < p.length) nodes.push(p.slice(last));
    out.push(<p key={pi}>{nodes}</p>);
  }
  return out;
}

export default function TranscriptViewer({
  filename,
  transcript,
  createdAt,
  durationSeconds,
  actions,
}: Props) {
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const paragraphs = useMemo(() => {
    const parts = transcript
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : [transcript.trim()];
  }, [transcript]);

  const trimmed = query.trim();
  const regex = useMemo(
    () => (trimmed ? new RegExp(escapeRegExp(trimmed), "gi") : null),
    [trimmed],
  );

  const matchCount = useMemo(
    () => (regex ? (transcript.match(regex) ?? []).length : 0),
    [regex, transcript],
  );

  // Scroll the active match into view when it changes
  useEffect(() => {
    if (!regex) return;
    const el = bodyRef.current?.querySelector<HTMLElement>("mark.hit-current");
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, regex]);

  function goTo(delta: number) {
    if (!matchCount) return;
    setCurrent((c) => (c + delta + matchCount) % matchCount);
  }

  const rendered = renderParagraphs(paragraphs, regex, current);

  const date = formatDate(createdAt) ?? formatDate(new Date().toISOString());
  const meta = [
    { icon: FileVideo, value: filename, title: "Video" },
    durationSeconds != null
      ? { icon: Clock3, value: formatDuration(durationSeconds), title: "Duration" }
      : null,
    { icon: AlignLeft, value: `${wordCount(transcript).toLocaleString()} words`, title: "Word count" },
    date ? { icon: Calendar, value: date, title: "Generated" } : null,
  ].filter(Boolean) as { icon: typeof FileVideo; value: string; title: string }[];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      // No overflow-hidden here: it would break the sticky action bar below
      className="card rounded-2xl"
      aria-labelledby="transcript-title"
    >
      {/* Header */}
      <header className="rounded-t-2xl border-b border-line px-5 pt-5 pb-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id="transcript-title" className="text-2xl font-semibold tracking-tight">
              Transcript
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
              {meta.map((m) => (
                <li key={m.title} className="flex min-w-0 items-center gap-1.5" title={m.title}>
                  <m.icon className="size-3.5 shrink-0 text-subtle" aria-hidden />
                  <span className="truncate">{m.value}</span>
                </li>
              ))}
            </ul>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </header>

      {/* Sticky action bar */}
      <div className="glass sticky top-16 z-10 flex flex-col gap-3 border-x-0 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <label className="relative flex-1">
          <span className="sr-only">Search in transcript</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrent(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                goTo(e.shiftKey ? -1 : 1);
              }
            }}
            placeholder="Search in transcript…"
            className="h-10 w-full rounded-lg border border-line bg-surface/70 pr-28 pl-9 text-sm placeholder:text-subtle focus:border-accent/60"
          />
          <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
            <AnimatePresence>
              {trimmed && (
                <motion.span
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  className={`px-1.5 font-mono text-xs ${matchCount ? "text-muted" : "text-danger"}`}
                  aria-live="polite"
                >
                  {matchCount ? `${current + 1}/${matchCount}` : "0/0"}
                </motion.span>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => goTo(-1)}
              disabled={!matchCount}
              aria-label="Previous match"
              className="grid size-7 place-items-center rounded-md text-subtle hover:bg-white/6 hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              disabled={!matchCount}
              aria-label="Next match"
              className="grid size-7 place-items-center rounded-md text-subtle hover:bg-white/6 hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="size-4" />
            </button>
            {trimmed && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCurrent(0);
                }}
                aria-label="Clear search"
                className="grid size-7 place-items-center rounded-md text-subtle hover:bg-white/6 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </label>

        <TranscriptActions transcript={transcript} filename={filename} />
      </div>

      {/* Body */}
      <div ref={bodyRef} className="rounded-b-2xl bg-surface/50 px-5 py-6 sm:px-8 sm:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto flex max-w-2xl flex-col gap-5 text-[15px] leading-8 text-zinc-200 sm:text-base sm:leading-8"
        >
          {rendered}
        </motion.div>
      </div>
    </motion.article>
  );
}
