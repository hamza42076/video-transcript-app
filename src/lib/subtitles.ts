import type { Segment } from "./types";

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

// 00:01:02,345
function srtTime(seconds: number) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

export function toSrt(segments: Segment[]) {
  return (
    segments
      .map((seg, i) => `${i + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.end)}\n${seg.text.trim()}`)
      .join("\n\n") + "\n"
  );
}
