"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileVideo, UploadCloud } from "lucide-react";
import Button from "@/components/ui/Button";

export const SUPPORTED_FORMATS = ["MP4", "MOV", "WebM", "MKV", "MP3", "WAV", "M4A"];

type Props = {
  onSelect: (file: File) => void;
  disabled?: boolean;
};

export default function UploadDropzone({ onSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  // Nested children fire dragleave; count enter/leave so the glow doesn't flicker
  const dragDepth = useRef(0);

  function handleFiles(list: FileList | null | undefined) {
    const file = list?.[0];
    if (file) onSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={disabled ? undefined : { scale: 1.005 }}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload a video file. Drop a file here or press Enter to browse."
      aria-disabled={disabled}
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center transition-[border-color,background-color,box-shadow] duration-300 sm:py-20 ${
        dragOver
          ? "glow-border border-transparent bg-accent/6 shadow-glow"
          : "border-dashed border-line-strong bg-white/2 hover:border-accent/50 hover:bg-white/3.5 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_20px_60px_-30px_rgba(139,92,246,0.5)]"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Icon with pulse ring on drag */}
      <div className="relative mb-6">
        {dragOver && (
          <span className="animate-pulse-ring absolute inset-0 rounded-2xl bg-accent/40" aria-hidden />
        )}
        <motion.span
          animate={dragOver ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative grid size-16 place-items-center rounded-2xl border border-line bg-surface-2 text-accent-soft shadow-card transition-transform group-hover:-translate-y-1"
        >
          {dragOver ? (
            <FileVideo className="size-7" aria-hidden />
          ) : (
            <UploadCloud className="size-7" aria-hidden />
          )}
        </motion.span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {dragOver ? "Release to upload" : "Drop your video here"}
      </h2>
      <p className="mt-2 text-sm text-muted">or click to browse from your computer</p>

      <div className="mt-6">
        <Button
          type="button"
          variant="secondary"
          size="md"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </Button>
      </div>

      <ul className="mt-7 flex flex-wrap items-center justify-center gap-1.5" aria-label="Supported formats">
        {SUPPORTED_FORMATS.map((f) => (
          <li
            key={f}
            className="rounded-md border border-line bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-subtle"
          >
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
