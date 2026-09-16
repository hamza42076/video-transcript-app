import type { Metadata } from "next";
import TranscribeFlow from "@/components/transcribe/TranscribeFlow";

export const metadata: Metadata = {
  title: "Transcribe",
};

export default function TranscribePage() {
  return <TranscribeFlow />;
}
