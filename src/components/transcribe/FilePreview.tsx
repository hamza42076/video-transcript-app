"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, FileAudio, FileVideo, HardDrive, Sparkles, Tag, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { fileKind, formatDuration, formatSize } from "@/lib/format";

type Props = {
  file: File;
  onRemove: () => void;
  onGenerate: () => void;
  onDuration?: (seconds: number) => void;
  busy?: boolean;
};

export default function FilePreview({ file, onRemove, onGenerate, onDuration, busy }: Props) {
  const kind = fileKind(file);
  // Object URL is created once per file (component is keyed by file upstream)
  const [src] = useState(() => URL.createObjectURL(file));
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  const meta = [
    { icon: HardDrive, label: "Size", value: formatSize(file.size) },
    { icon: Tag, label: "Type", value: file.type || file.name.split(".").pop()?.toUpperCase() || "—" },
    { icon: Clock3, label: "Duration", value: duration != null ? formatDuration(duration) : "…" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden rounded-2xl"
    >
      {/* Media */}
      <div className="relative bg-black">
        {kind === "video" ? (
          <video
            src={src}
            controls
            preload="metadata"
            playsInline
            className="mx-auto max-h-[420px] w-full"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) {
                setDuration(d);
                onDuration?.(d);
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-12">
            <span className="grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent-soft">
              <FileAudio className="size-7" aria-hidden />
            </span>
            <audio
              src={src}
              controls
              preload="metadata"
              className="w-full max-w-md"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) {
                  setDuration(d);
                  onDuration?.(d);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent-soft">
              {kind === "audio" ? (
                <FileAudio className="size-5" aria-hidden />
              ) : (
                <FileVideo className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-subtle">Ready to transcribe</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label="Remove file"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-white/6 hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {meta.map((m) => (
            <div key={m.label} className="rounded-xl border border-line bg-surface/60 px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
                <m.icon className="size-3" aria-hidden />
                {m.label}
              </dt>
              <dd className="mt-1 truncate text-sm font-medium" title={m.value}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={onRemove} disabled={busy}>
            Change file
          </Button>
          <Button type="button" glow size="lg" onClick={onGenerate} loading={busy}>
            {!busy && <Sparkles className="size-4" aria-hidden />}
            {busy ? "Starting…" : "Generate Transcript"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
