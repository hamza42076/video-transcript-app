// Shape returned by /api/videos — mirrors the Video mongoose model.
export type Segment = {
  start: number; // seconds
  end: number;
  text: string;
};

export type VideoItem = {
  _id: string;
  filename: string;
  transcript?: string;
  /** Public URL of the stored file, e.g. "/uploads/123-name.mp4". Older records may not have one. */
  videoUrl?: string;
  /** Whisper segments with timestamps. Empty for older records. */
  segments?: Segment[];
  createdAt?: string;
};

export type ApiErrorKind =
  | "unsupported"
  | "too-large"
  | "network"
  | "upload"
  | "processing";

export class ApiError extends Error {
  kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}
