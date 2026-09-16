"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, ArrowLeft, Calendar, Captions, FileVideo, FolderOpen, Play, Search, Trash2, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import VideoDetail from "@/components/video/VideoDetail";
import { deleteVideo, fetchVideos } from "@/lib/api";
import { formatDate, wordCount } from "@/lib/format";
import type { VideoItem } from "@/lib/types";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; videos: VideoItem[] }
  | { kind: "error"; message: string };

export default function HistoryList() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VideoItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteVideo(pendingDelete._id);
      setState((s) =>
        s.kind === "ready" ? { kind: "ready", videos: s.videos.filter((v) => v._id !== pendingDelete._id) } : s,
      );
      if (selected?._id === pendingDelete._id) setSelected(null);
      toast({ kind: "success", title: "Transcript deleted", description: pendingDelete.filename });
      setPendingDelete(null);
    } catch (e) {
      toast({ kind: "error", title: "Couldn’t delete", description: e instanceof Error ? e.message : undefined });
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchVideos()
      .then((videos) => {
        if (!cancelled) setState({ kind: "ready", videos });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ kind: "error", message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.videos;
    return state.videos.filter(
      (v) => v.filename.toLowerCase().includes(q) || (v.transcript ?? "").toLowerCase().includes(q),
    );
  }, [state, query]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to history
            </button>
            <VideoDetail
              video={selected}
              actions={
                <Button type="button" variant="danger" size="sm" onClick={() => setPendingDelete(selected)}>
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.header
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">History</h1>
                <p className="mt-2 text-muted">All the transcripts you&apos;ve generated.</p>
              </div>
              <label className="relative w-full sm:w-72">
                <span className="sr-only">Search transcripts</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or content…"
                  className="h-10 w-full rounded-lg border border-line bg-surface/70 pl-9 pr-3 text-sm placeholder:text-subtle focus:border-accent/60"
                />
              </label>
            </motion.header>

            {state.kind === "loading" && (
              <ul className="grid gap-3 sm:grid-cols-2" aria-busy aria-label="Loading transcripts">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="card relative h-36 overflow-hidden rounded-2xl">
                    <span className="animate-shimmer absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/4 to-transparent" />
                  </li>
                ))}
              </ul>
            )}

            {state.kind === "error" && (
              <div role="alert" className="card rounded-2xl border-danger/25 px-6 py-12 text-center">
                <p className="font-medium">Couldn&apos;t load your history</p>
                <p className="mt-1 text-sm text-muted">{state.message}</p>
              </div>
            )}

            {state.kind === "ready" && filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex flex-col items-center gap-4 rounded-2xl px-6 py-16 text-center"
              >
                <motion.span
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent-soft"
                >
                  <FolderOpen className="size-7" aria-hidden />
                </motion.span>
                <div>
                  <h2 className="text-lg font-semibold">
                    {query ? "No matches" : "No transcripts yet"}
                  </h2>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted">
                    {query
                      ? `Nothing matched "${query}". Try a different search.`
                      : "Upload a video to generate your first transcript."}
                  </p>
                </div>
                {!query && (
                  <Link
                    href="/transcribe"
                    className="mt-2 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-accent-soft to-accent px-5 text-sm font-medium text-white shadow-glow"
                  >
                    <Upload className="size-4" aria-hidden />
                    Upload Video
                  </Link>
                )}
              </motion.div>
            )}

            {state.kind === "ready" && filtered.length > 0 && (
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {filtered.map((v) => {
                  const text = v.transcript ?? "";
                  const date = formatDate(v.createdAt);
                  return (
                    <motion.li
                      key={v._id}
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="card group relative overflow-hidden rounded-2xl"
                    >
                      <button
                        type="button"
                        onClick={() => setPendingDelete(v)}
                        aria-label={`Delete ${v.filename}`}
                        title="Delete"
                        className="absolute top-2 right-2 z-10 grid size-9 place-items-center rounded-lg bg-black/60 text-white/80 backdrop-blur transition-[opacity,background-color,color] hover:bg-danger hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelected(v)}
                        aria-label={`Open ${v.filename}`}
                        className="flex w-full flex-col text-left"
                      >
                        {/* Thumbnail: first frame of the stored video, or a placeholder for older records */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          {v.videoUrl ? (
                            <video
                              src={`${v.videoUrl}#t=0.5`}
                              muted
                              playsInline
                              preload="metadata"
                              tabIndex={-1}
                              aria-hidden
                              className="pointer-events-none size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="grid size-full place-items-center bg-surface-2 text-subtle">
                              <FileVideo className="size-8" aria-hidden />
                            </div>
                          )}
                          {v.videoUrl && (
                            <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="grid size-12 place-items-center rounded-full bg-white/90 text-black shadow-glow">
                                <Play className="ml-0.5 size-5" aria-hidden />
                              </span>
                            </span>
                          )}
                          {(v.segments?.length ?? 0) > 0 && (
                            <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                              <Captions className="size-3" aria-hidden /> CC
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium" title={v.filename}>
                            {v.filename}
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-subtle">
                            {date && (
                              <li className="flex items-center gap-1">
                                <Calendar className="size-3" aria-hidden /> {date}
                              </li>
                            )}
                            <li className="flex items-center gap-1">
                              <AlignLeft className="size-3" aria-hidden /> {wordCount(text).toLocaleString()} words
                            </li>
                          </ul>
                        </div>
                        <p dir="auto" className="line-clamp-2 text-sm leading-6 text-muted">
                          {text || <span className="italic">No transcript text.</span>}
                        </p>
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this transcript?"
        description={
          pendingDelete
            ? `"${pendingDelete.filename}" and its transcript will be permanently removed.`
            : undefined
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
