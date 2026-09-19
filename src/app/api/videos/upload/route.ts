import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      // Browser ko token dene se pehle rules set karo
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "video/mp4", "video/quicktime", "video/webm", "video/x-matroska",
          "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg",
        ],
        maximumSizeInBytes: 25 * 1024 * 1024,   // Whisper limit
        addRandomSuffix: true,                    // same naam ki files clash na karein
      }),
      onUploadCompleted: async () => {
        // Kuch nahi karna — DB save /api/videos mein hota hai
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
