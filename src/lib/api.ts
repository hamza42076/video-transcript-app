import { upload } from "@vercel/blob/client";
import { ApiError, type VideoItem } from "./types";

// API contract:
//   POST /api/videos/upload  (used internally by @vercel/blob client to mint an upload token)
//   POST /api/videos         JSON { url, filename }  -> VideoItem
//   GET  /api/videos                                 -> VideoItem[]
//   DELETE /api/videos/:id                           -> { ok: true }

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // Whisper limit

export type UploadProgress = { loaded: number; total: number; percentage: number };

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-_]/g, "_");
}

// 1) Browser -> Vercel Blob directly (bypasses the 4.5 MB serverless body limit)
// 2) Browser -> our API with just the blob URL; server fetches it and runs Whisper
export async function uploadVideo(
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<VideoItem> {
  let blobUrl: string;
  try {
    const blob = await upload(sanitize(file.name), file, {
      access: "public",
      handleUploadUrl: "/api/videos/upload",
      contentType: file.type || undefined,
      onUploadProgress: onProgress,
    });
    blobUrl = blob.url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/content type|contentType/i.test(msg)) {
      throw new ApiError("unsupported", "This file type isn’t supported. Try MP4, MOV, WebM, MP3 or WAV.");
    }
    if (/size|too large|maximum/i.test(msg)) {
      throw new ApiError("too-large", "This file is too large. The limit is 25 MB.");
    }
    throw new ApiError("network", msg || "Upload failed. Check your connection and try again.");
  }

  let res: Response;
  try {
    res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: blobUrl, filename: file.name }),
    });
  } catch {
    throw new ApiError("network", "We couldn’t reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const serverMessage = typeof body?.error === "string" ? body.error : null;

    if (res.status === 413) {
      throw new ApiError("too-large", serverMessage ?? "This file is too large to process.");
    }
    if (res.status === 415) {
      throw new ApiError("unsupported", serverMessage ?? "This file type isn’t supported.");
    }
    if (res.status >= 500) {
      throw new ApiError("processing", serverMessage ?? "Transcription failed on our side. Please try again.");
    }
    throw new ApiError("upload", serverMessage ?? `Upload failed (${res.status}).`);
  }

  return res.json();
}

export async function fetchVideos(): Promise<VideoItem[]> {
  const res = await fetch("/api/videos", { cache: "no-store" });
  if (!res.ok) throw new ApiError("network", `Failed to load history (${res.status}).`);
  const data = await res.json();
  // Backend GET currently returns a status message; only treat arrays as history.
  return Array.isArray(data) ? data : [];
}

// DELETE /api/videos/:id -> 200/204 on success, { error } otherwise
export async function deleteVideo(id: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
  } catch {
    throw new ApiError("network", "We couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof body?.error === "string" ? body.error : `Delete failed (${res.status}).`;
    throw new ApiError("upload", msg);
  }
}
