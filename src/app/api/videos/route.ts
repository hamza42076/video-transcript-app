import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";
import OpenAI from "openai";
import path from "path";
import fs from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});


export async function GET() {
  await connectDB();
  const videos = await Video.find().sort({ createdAt: -1 });
  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File size exceeds 25MB limit" },
      { status: 413 },
    );
  }

  try {
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(
      path.join(uploadDir, safeName),
      Buffer.from(await file.arrayBuffer()),
    );

    await connectDB();
    const video = await Video.create({
      filename: file.name,
      transcript: result.text,
      videoUrl: `/uploads/${safeName}`,
      segments:result.segments?.map((s)=>{
        return {
          start:s.start,
          end:s.end,
          text:s.text
        }
      })??[],
    });
    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 },
    );
  }
}
