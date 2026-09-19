import type { Segment, VideoItem, Word } from "./types";

// Turns Whisper output into short caption "cues" (what you'd see on screen at once).
// Whisper segments can be a whole sentence or even a paragraph, which would cover
// the video — so we rebuild cues from word timestamps when we have them, and
// otherwise split long segments proportionally by character count.

const MAX_CHARS = 56;      // ~2 lines at our caption font size
const MAX_DURATION = 3.5;  // seconds a cue may stay on screen
const GAP_BREAK = 0.8;     // a pause this long starts a new cue
const MIN_CHARS_FOR_PUNCT_BREAK = 24;

const END_PUNCT = /[.!?۔؟،,;:]$/;

function fromWords(words: Word[]): Segment[] {
  const cues: Segment[] = [];
  let buf: Word[] = [];

  const flush = () => {
    if (!buf.length) return;
    cues.push({
      start: buf[0].start,
      end: buf[buf.length - 1].end,
      text: buf.map((w) => w.word.trim()).join(" "),
    });
    buf = [];
  };

  for (const w of words) {
    const word = w.word.trim();
    if (!word) continue;
    if (buf.length) {
      const chars = buf.reduce((n, x) => n + x.word.trim().length + 1, 0) + word.length;
      const duration = w.end - buf[0].start;
      const gap = w.start - buf[buf.length - 1].end;
      const prevEndsClause = END_PUNCT.test(buf[buf.length - 1].word.trim());
      const prevChars = chars - word.length - 1;
      if (
        chars > MAX_CHARS ||
        duration > MAX_DURATION ||
        gap > GAP_BREAK ||
        (prevEndsClause && prevChars >= MIN_CHARS_FOR_PUNCT_BREAK)
      ) {
        flush();
      }
    }
    buf.push(w);
  }
  flush();
  return cues;
}

// No word timestamps: split a long segment into N balanced chunks and share its time by character weight.
function splitSegment(seg: Segment): Segment[] {
  const text = seg.text.trim();
  if (text.length <= MAX_CHARS) return [{ ...seg, text }];

  const words = text.split(/\s+/);
  const parts = Math.ceil(text.length / MAX_CHARS);
  const target = Math.ceil(words.length / parts);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += target) chunks.push(words.slice(i, i + target).join(" "));

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const span = seg.end - seg.start;
  let t = seg.start;
  return chunks.map((c) => {
    const d = (c.length / total) * span;
    const cue = { start: t, end: t + d, text: c };
    t += d;
    return cue;
  });
}

export function buildCaptionCues(video: Pick<VideoItem, "segments" | "words">): Segment[] {
  if (video.words && video.words.length > 0) return fromWords(video.words);
  return (video.segments ?? []).flatMap(splitSegment);
}
