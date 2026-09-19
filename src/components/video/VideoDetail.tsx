"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, Calendar, Captions, Clock3, FileVideo, ListVideo } from "lucide-react";
import TranscriptActions from "@/components/transcribe/TranscriptActions";
import TranscriptViewer from "@/components/transcribe/TranscriptViewer";
import { formatDate, formatDuration, wordCount } from "@/lib/format";
import type { Segment, VideoItem } from "@/lib/types";

type Props = {
  video: VideoItem;
  /** Optional slot for extra actions such as "New transcript". */
  actions?: React.ReactNode;
};

function activeSegmentIndex(segments: Segment[], t: number) {
  return segments.findIndex((s) => t >= s.start && t < s.end);
}

export default function VideoDetail({ video, actions }: Props) {
  const segments = (video.segments ?? []).map((s) => ({ ...s, text: s.text.trim() }));
  const transcript = video.transcript ?? "";

  // Older records have no stored file — fall back to the plain reader.
  if (!video.videoUrl) {
    return (
      <TranscriptViewer
        filename={video.filename}
        transcript={transcript}
        createdAt={video.createdAt}
        actions={actions}
      />
    );
  }

  return <Player video={video} segments={segments} transcript={transcript} actions={actions} />;
}

function Player({
  video,
  segments,
  transcript,
  actions,
}: {
  video: VideoItem;
  segments: Segment[];
  transcript: string;
  actions?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const active = activeSegmentIndex(segments, time);
  const caption = active >= 0 ? segments[active].text : "";

  // Keep the active line visible inside the transcript list (scroll the list only, not the page)
  useEffect(() => {
    const list = listRef.current;
    if (!list || active < 0) return;
    const el = list.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!el) return;
    const top = el.offsetTop - list.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
    }
  }, [active]);

  function seekTo(seconds: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = seconds;
    void v.play();
  }

  const date = formatDate(video.createdAt);
  const meta = [
    { icon: FileVideo, value: video.filename, title: "Video" },
    duration != null ? { icon: Clock3, value: formatDuration(duration), title: "Duration" } : null,
    { icon: AlignLeft, value: `${wordCount(transcript).toLocaleString()} words`, title: "Word count" },
    date ? { icon: Calendar, value: date, title: "Generated" } : null,
  ].filter(Boolean) as { icon: typeof FileVideo; value: string; title: string }[];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
      aria-labelledby="video-title"
    >
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="video-title" className="truncate text-2xl font-semibold tracking-tight" title={video.filename}>
            {video.filename}
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
        <div className="flex shrink-0 flex-wrap gap-2">
          <TranscriptActions
            transcript={transcript}
            filename={video.filename}
            segments={segments}
            videoUrl={video.videoUrl}
          />
          {actions}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Player + live caption */}
        <div className="card overflow-hidden rounded-2xl">
          <div className="bg-black">
            <video
              ref={videoRef}
              src={video.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="mx-auto max-h-[60vh] w-full"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) setDuration(d);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          </div>

          {/* Caption strip — YouTube-style, follows the current segment */}
          <div
            className="flex min-h-[72px] items-center justify-center border-t border-line bg-surface-2 px-5 py-3 text-center"
            aria-live="polite"
          >
            <AnimatePresence mode="wait" initial={false}>
              {caption ? (
                <motion.p
                  key={active}
                  dir="auto"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="text-base leading-7 font-medium sm:text-lg"
                >
                  {caption}
                </motion.p>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 text-sm text-subtle"
                >
                  <Captions className="size-4" aria-hidden />
                  {playing ? "…" : "Press play to see live captions"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive transcript */}
        <aside className="card flex min-h-0 flex-col rounded-2xl">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-medium">
            <ListVideo className="size-4 text-accent-soft" aria-hidden />
            Transcript
            <span className="ml-auto text-xs font-normal text-subtle">
              {segments.length} {segments.length === 1 ? "line" : "lines"}
            </span>
          </div>

          {segments.length === 0 ? (
            <p dir="auto" className="px-4 py-5 text-sm leading-7 text-zinc-200">
              {transcript || "No transcript text."}
            </p>
          ) : (
            <ol
              ref={listRef}
              className="relative max-h-[50vh] overflow-y-auto p-2 lg:max-h-[calc(60vh+72px-49px)]"
              aria-label="Transcript lines — click to jump"
            >
              {segments.map((s, i) => {
                const isActive = i === active;
                return (
                  <li key={i} data-index={i}>
                    <button
                      type="button"
                      onClick={() => seekTo(s.start)}
                      aria-current={isActive ? "true" : undefined}
                      className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? "bg-accent/15 text-foreground"
                          : "text-zinc-300 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums transition-colors ${
                          isActive ? "bg-accent text-white" : "bg-white/6 text-subtle group-hover:text-muted"
                        }`}
                      >
                        {formatDuration(s.start)}
                      </span>
                      <span dir="auto" className="text-sm leading-6">
                        {s.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>
    </motion.article>
  );
}
