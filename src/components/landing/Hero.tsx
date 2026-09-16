"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Clock3, Copy, FileText, Sparkles, Upload, Zap } from "lucide-react";
import Waveform from "@/components/ui/Waveform";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  {
    icon: Upload,
    title: "Upload any video",
    body: "Drag and drop MP4, MOV, WebM and more. Audio files work too.",
  },
  {
    icon: Sparkles,
    title: "AI transcription",
    body: "Speech is turned into clean, readable text — no manual typing.",
  },
  {
    icon: Copy,
    title: "Copy or download",
    body: "Search inside the transcript, copy it in one click, or save as TXT.",
  },
];

const steps = [
  { icon: Upload, label: "Upload", body: "Pick a video from your device." },
  { icon: Zap, label: "Process", body: "The audio is analyzed by AI." },
  { icon: FileText, label: "Read", body: "Get a polished, searchable transcript." },
];

export default function Hero() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28"
    >
      <motion.span
        variants={item}
        className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted"
      >
        <span className="relative flex size-2">
          <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-accent" />
          <span className="relative inline-flex size-2 rounded-full bg-accent-soft" />
        </span>
        AI-powered video transcription
      </motion.span>

      <motion.h1
        variants={item}
        className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-6xl md:text-7xl"
      >
        Turn Your Videos Into{" "}
        <span className="text-gradient">Accurate Transcripts</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
      >
        Upload a video and let AI generate a clean, readable transcript in minutes.
        Search it, copy it, or download it — all in one place.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
          <Link
            href="/transcribe"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-accent-soft to-accent px-7 text-base font-medium text-white shadow-glow transition-shadow hover:shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_10px_50px_-6px_rgba(139,92,246,0.65)] sm:w-auto"
          >
            <Upload className="size-4" aria-hidden />
            Upload Video
          </Link>
        </motion.div>
        <Link
          href="/history"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white/3 px-6 text-base text-foreground transition-colors hover:border-line-strong hover:bg-white/6 sm:w-auto"
        >
          View history
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </motion.div>

      {/* Product glimpse */}
      <motion.div
        variants={item}
        className="card relative mt-16 w-full max-w-3xl overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_70%)]"
        />
        <div className="relative flex flex-col items-center gap-5">
          <Waveform bars={40} className="h-14 w-full max-w-md" />
          <div className="w-full max-w-xl rounded-xl border border-line bg-surface/80 p-4 text-left">
            <div className="mb-3 flex items-center gap-2 text-xs text-subtle">
              <FileText className="size-3.5" aria-hidden />
              transcript.txt
              <span className="ml-auto inline-flex items-center gap-1">
                <Clock3 className="size-3" aria-hidden /> 04:12
              </span>
            </div>
            <p className="text-sm leading-6 text-muted">
              <span className="text-foreground">Welcome back to the show.</span> Today we&apos;re
              talking about how teams can turn hours of recorded meetings into searchable notes
              in just a few minutes…
            </p>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <motion.ul
        variants={container}
        className="mt-20 grid w-full gap-4 sm:grid-cols-3"
        aria-label="Features"
      >
        {features.map((f) => (
          <motion.li
            key={f.title}
            variants={item}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="card rounded-2xl p-6 text-left"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-accent/15 text-accent-soft">
              <f.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-muted">{f.body}</p>
          </motion.li>
        ))}
      </motion.ul>

      {/* How it works */}
      <motion.section variants={item} className="mt-20 w-full" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex flex-col items-center gap-3">
              <span className="relative grid size-12 place-items-center rounded-full border border-line bg-surface-2 text-accent-soft">
                <s.icon className="size-5" aria-hidden />
                <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
              </span>
              <p className="font-medium">{s.label}</p>
              <p className="max-w-[220px] text-sm leading-6 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </motion.section>
    </motion.div>
  );
}
