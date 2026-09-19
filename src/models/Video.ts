import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    transcript: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    segments: [{
      start: Number,
      end: Number,
      text: String,
    }],
    words: [{
      start: Number,
      end: Number,
      word: String,
    }],
  },
  { timestamps: true },
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
