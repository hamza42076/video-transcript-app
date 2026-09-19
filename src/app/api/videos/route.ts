import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export async function GET() {
  await connectDB();
  const videos = await Video.find().sort({ createdAt: -1 });
  return NextResponse.json(videos);
}

export const maxDuration = 300; // Whisper bade files pe time leta hai — Vercel ko 5 min tak ki ijazat

export async function POST(request: Request) {
  const { url, filename } = await request.json();

  if (typeof url !== "string" || typeof filename !== "string") {
    return NextResponse.json({ error: "url and filename are required" }, { status: 400 });
  }

  try {
    // 1. Blob se file wapas lo (server → Blob, koi request limit nahi)
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch uploaded file");
    const data = await res.blob();

    if (data.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 25MB limit" }, { status: 413 });
    }

    // 2. Whisper ko File chahiye — blob se banao
    const file = new File([data], filename, { type: data.type });

    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    // 3. DB mein save — videoUrl wahi jo browser ne bheja
    await connectDB();
    const video = await Video.create({
      filename,
      transcript: result.text,
      videoUrl: url,
      segments: result.segments?.map((s) => ({ start: s.start, end: s.end, text: s.text })) ?? [],
    });
    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}

