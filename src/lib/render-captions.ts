import type { Segment } from "./types";

// Renders the video with burned-in captions entirely in the browser:
// <video> → <canvas> (frame + caption text) → MediaRecorder → Blob.
// Runs in real time (a 30s video takes ~30s) and needs the tab to stay visible.

export type RenderResult = { blob: Blob; ext: "mp4" | "webm"; mimeType: string };

export type RenderOptions = {
  src: string;
  segments: Segment[];
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

const MAX_DIMENSION = 1280; // keep encoding cheap on laptops

const CANDIDATE_TYPES: { mime: string; ext: "mp4" | "webm" }[] = [
  { mime: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', ext: "mp4" },
  { mime: "video/mp4", ext: "mp4" },
  { mime: 'video/webm;codecs="vp9,opus"', ext: "webm" },
  { mime: 'video/webm;codecs="vp8,opus"', ext: "webm" },
  { mime: "video/webm", ext: "webm" },
];

/** Which container this browser can produce, or null if recording isn't supported at all. */
export function supportedOutput(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined") return null;
  if (!("captureStream" in HTMLCanvasElement.prototype)) return null;
  return CANDIDATE_TYPES.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? null;
}

const RTL_RE = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, W: number, H: number) {
  const fontSize = Math.round(Math.max(18, H * 0.046));
  ctx.font = `600 ${fontSize}px system-ui, "Segoe UI", Roboto, "Noto Naskh Arabic", "Noto Sans Arabic", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = RTL_RE.test(text) ? "rtl" : "ltr";

  const lines = wrapWords(ctx, text, W * 0.86);
  const lineH = fontSize * 1.4;
  const padX = fontSize * 0.55;
  const bottomMargin = H * 0.07;
  const firstCenterY = H - bottomMargin - lineH * (lines.length - 0.5);

  lines.forEach((line, i) => {
    const cy = firstCenterY + i * lineH;
    const tw = ctx.measureText(line).width;
    const bw = tw + padX * 2;
    const bh = lineH;
    const bx = W / 2 - bw / 2;
    const by = cy - bh / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, fontSize * 0.3);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, W / 2, cy + fontSize * 0.04);
  });
}

function activeText(segments: Segment[], t: number) {
  const s = segments.find((x) => t >= x.start && t < x.end);
  return s ? s.text.trim() : "";
}

export function renderCaptionedVideo({ src, segments, onProgress, signal }: RenderOptions): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    const output = supportedOutput();
    if (!output) {
      reject(new Error("This browser can't record video. Try the latest Chrome or Firefox."));
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous"; // Vercel Blob sends CORS headers; needed to draw frames & tap audio
    video.preload = "auto";
    video.playsInline = true;
    video.src = src;

    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;
    let frameHandle = 0;
    let usingVfc = false;
    const chunks: BlobPart[] = [];
    let finished = false;

    const cleanup = () => {
      if (usingVfc && "cancelVideoFrameCallback" in video) {
        (video as HTMLVideoElement & { cancelVideoFrameCallback(h: number): void }).cancelVideoFrameCallback(frameHandle);
      } else {
        cancelAnimationFrame(frameHandle);
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
      void audioCtx?.close().catch(() => {});
    };

    const fail = (err: unknown) => {
      if (finished) return;
      finished = true;
      try {
        if (recorder && recorder.state !== "inactive") recorder.stop();
      } catch {}
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    signal?.addEventListener("abort", () => fail(new DOMException("Render cancelled", "AbortError")));

    video.addEventListener("error", () => fail(new Error("Couldn't load the video for rendering.")));

    video.addEventListener(
      "loadedmetadata",
      async () => {
        try {
          const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
          // Even dimensions keep H.264 encoders happy
          const W = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
          const H = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

          const canvas = document.createElement("canvas");
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) throw new Error("Canvas isn't available.");

          // Route the element's audio into the recording stream (and not to the speakers)
          const stream = canvas.captureStream(30);
          try {
            audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
            await audioCtx.resume();
          } catch {
            // No audio graph (e.g. CORS blocked) — still produce a silent video rather than failing
          }

          recorder = new MediaRecorder(stream, {
            mimeType: output.mime,
            videoBitsPerSecond: 5_000_000,
            audioBitsPerSecond: 128_000,
          });
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          recorder.onerror = () => fail(new Error("Recording failed."));
          recorder.onstop = () => {
            if (finished) return;
            finished = true;
            cleanup();
            resolve({ blob: new Blob(chunks, { type: output.mime }), ext: output.ext, mimeType: output.mime });
          };

          const draw = () => {
            ctx.drawImage(video, 0, 0, W, H);
            const text = activeText(segments, video.currentTime);
            if (text) drawCaption(ctx, text, W, H);
            onProgress?.(video.duration ? Math.min(1, video.currentTime / video.duration) : 0);
          };

          const schedule = () => {
            if (finished) return;
            if ("requestVideoFrameCallback" in video) {
              usingVfc = true;
              frameHandle = (video as HTMLVideoElement & {
                requestVideoFrameCallback(cb: () => void): number;
              }).requestVideoFrameCallback(() => {
                draw();
                schedule();
              });
            } else {
              frameHandle = requestAnimationFrame(() => {
                draw();
                schedule();
              });
            }
          };

          video.addEventListener("ended", () => {
            draw();
            onProgress?.(1);
            // Give the encoder a moment to flush the last frames
            window.setTimeout(() => {
              if (recorder && recorder.state !== "inactive") recorder.stop();
            }, 250);
          });

          video.currentTime = 0;
          draw();
          recorder.start(1000);
          schedule();
          await video.play();
        } catch (err) {
          fail(err);
        }
      },
      { once: true },
    );

    video.load();
  });
}
