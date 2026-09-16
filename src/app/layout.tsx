import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Background from "@/components/Background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TranscriptAI — Turn videos into accurate transcripts",
    template: "%s · TranscriptAI",
  },
  description:
    "Upload a video and get an accurate, readable AI-generated transcript in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Background />
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="mt-auto border-t border-line py-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-subtle sm:flex-row sm:px-6">
              <p>© {new Date().getFullYear()} TranscriptAI</p>
              <p>Upload · Transcribe · Copy · Download</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
