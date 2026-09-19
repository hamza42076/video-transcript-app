"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import UploadDropzone from "./UploadDropzone";
import FilePreview from "./FilePreview";
import ProcessingState from "./ProcessingState";
import TranscriptViewer from "./TranscriptViewer";
import VideoDetail from "@/components/video/VideoDetail";
import ErrorState from "./ErrorState";
import { MAX_FILE_BYTES, uploadVideo } from "@/lib/api";
import { ApiError, type ApiErrorKind, type VideoItem } from "@/lib/types";
import { fileKind, formatSize } from "@/lib/format";

type Stage =
  | { kind: "idle" }
  | { kind: "selected"; file: File }
  | { kind: "processing"; file: File; progress: number | null }
  | { kind: "done"; file: File; video: VideoItem }
  | { kind: "error"; file: File | null; errorKind: ApiErrorKind; message: string };

export default function TranscribeFlow() {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [duration, setDuration] = useState<number | null>(null);

  function select(file: File) {
    if (fileKind(file) === "other") {
      setStage({
        kind: "error",
        file: null,
        errorKind: "unsupported",
        message: `"${file.name}" doesn't look like a video or audio file. Try MP4, MOV, WebM, MP3 or WAV.`,
      });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStage({
        kind: "error",
        file: null,
        errorKind: "too-large",
        message: `"${file.name}" is ${formatSize(file.size)}. The limit is ${formatSize(MAX_FILE_BYTES)}.`,
      });
      return;
    }
    setDuration(null);
    setStage({ kind: "selected", file });
  }

  function reset() {
    setDuration(null);
    setStage({ kind: "idle" });
  }

  async function generate(file: File) {
    setStage({ kind: "processing", file, progress: 0 });
    try {
      const video = await uploadVideo(file, (p) => {
        // Real upload progress from the Blob client; null once upload finishes and transcription starts
        setStage({ kind: "processing", file, progress: p.percentage >= 100 ? null : p.percentage });
      });
      if (!video?.transcript) {
        // Backend answered but without text — treat as a processing failure rather than showing an empty reader
        throw new ApiError("processing", "The server responded, but no transcript text was returned.");
      }
      setStage({ kind: "done", file, video });
      toast({ kind: "success", title: "Transcript ready", description: file.name });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError("upload", "Something went wrong. Please try again.");
      setStage({ kind: "error", file, errorKind: err.kind, message: err.message });
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {stage.kind === "done" ? "Your transcript is ready" : "Transcribe a video"}
        </h1>
        <p className="mt-2 text-muted">
          {stage.kind === "done"
            ? "Search, copy or download it below."
            : "Upload a video or audio file and get a clean transcript."}
        </p>
      </motion.header>

      <AnimatePresence mode="wait">
        {stage.kind === "idle" && <UploadDropzone key="drop" onSelect={select} />}

        {stage.kind === "selected" && (
          <FilePreview
            key={`preview-${stage.file.name}-${stage.file.size}`}
            file={stage.file}
            onRemove={reset}
            onDuration={setDuration}
            onGenerate={() => generate(stage.file)}
          />
        )}

        {stage.kind === "processing" && (
          <ProcessingState key="processing" filename={stage.file.name} uploadProgress={stage.progress} />
        )}

        {stage.kind === "done" && stage.video.videoUrl && (
          <VideoDetail
            key="video"
            video={stage.video}
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={reset}>
                <Plus className="size-4" aria-hidden />
                New transcript
              </Button>
            }
          />
        )}

        {stage.kind === "done" && !stage.video.videoUrl && (
          <TranscriptViewer
            key="viewer"
            filename={stage.video.filename || stage.file.name}
            transcript={stage.video.transcript ?? ""}
            createdAt={stage.video.createdAt}
            durationSeconds={duration}
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={reset}>
                <Plus className="size-4" aria-hidden />
                New transcript
              </Button>
            }
          />
        )}

        {stage.kind === "error" && (
          <ErrorState
            key="error"
            kind={stage.errorKind}
            message={stage.message}
            onReset={reset}
            onRetry={stage.file ? () => generate(stage.file!) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
