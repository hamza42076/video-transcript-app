import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import connectDB from "@/lib/mongodb";
import Video from "@/models/Video";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await connectDB();
  const video = await Video.findById(id);
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.videoUrl) {
        await del(video.videoUrl).catch(() => {});

  }

  await video.deleteOne();
  return NextResponse.json({ ok: true });
}
