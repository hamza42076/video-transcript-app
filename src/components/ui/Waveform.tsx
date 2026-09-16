// Animated sound-wave bars. `active` runs the animation; otherwise bars sit idle.
export default function Waveform({
  bars = 24,
  active = true,
  className = "",
}: {
  bars?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`flex h-10 items-center justify-center gap-[3px] ${className}`}
    >
      {Array.from({ length: bars }).map((_, i) => {
        // Vary heights/delays so it reads like a real waveform rather than a metronome
        const center = Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
        const height = 100 - center * 55;
        return (
          <span
            key={i}
            className={`w-[3px] rounded-full bg-gradient-to-t from-accent to-accent-2 ${
              active ? "animate-wave" : ""
            }`}
            style={{
              height: `${height}%`,
              animationDelay: `${(i % 7) * 0.12}s`,
              animationDuration: `${0.9 + (i % 5) * 0.12}s`,
              opacity: active ? 1 : 0.35,
              transform: active ? undefined : "scaleY(0.3)",
            }}
          />
        );
      })}
    </div>
  );
}
