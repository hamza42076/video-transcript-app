import { ApiError, type VideoItem } from "./types";

// API contract (unchanged):
//   POST /api/videos  multipart, field "file"  -> VideoItem
//   GET  /api/videos                            -> VideoItem[]

export async function uploadVideo(file: File): Promise<VideoItem> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/videos", { method: "POST", body: formData });
  } catch {
    throw new ApiError("network", "We couldn't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const serverMessage = typeof body?.error === "string" ? body.error : null;

    if (res.status === 413) {
      throw new ApiError("too-large", serverMessage ?? "This file is too large to process.");
    }
    if (res.status === 415) {
      throw new ApiError("unsupported", serverMessage ?? "This file type isn't supported.");
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
