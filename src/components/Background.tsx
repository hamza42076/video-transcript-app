// Ambient page background: grid + blurred orbs + a few slow particles.
// Pure CSS animations (transform/opacity only) so it stays cheap.

const PARTICLES = [
  { left: "12%", top: "70%", delay: "0s", size: 3 },
  { left: "28%", top: "85%", delay: "3s", size: 2 },
  { left: "47%", top: "78%", delay: "6s", size: 3 },
  { left: "63%", top: "88%", delay: "1.5s", size: 2 },
  { left: "78%", top: "74%", delay: "4.5s", size: 3 },
  { left: "90%", top: "82%", delay: "8s", size: 2 },
];

export default function Background({ intense = false }: { intense?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid absolute inset-0" />

      {/* Orbs */}
      <div
        className={`animate-orb absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full blur-[120px] ${
          intense ? "opacity-60" : "opacity-40"
        }`}
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.55), rgba(139,92,246,0) 70%)",
        }}
      />
      <div
        className="animate-orb absolute top-1/3 -left-40 h-[420px] w-[420px] rounded-full opacity-25 blur-[110px]"
        style={{
          animationDelay: "-6s",
          background:
            "radial-gradient(closest-side, rgba(96,165,250,0.5), rgba(96,165,250,0) 70%)",
        }}
      />
      <div
        className="animate-orb absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full opacity-20 blur-[100px]"
        style={{
          animationDelay: "-12s",
          background:
            "radial-gradient(closest-side, rgba(167,139,250,0.5), rgba(167,139,250,0) 70%)",
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-particle absolute rounded-full bg-accent-soft/70"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            boxShadow: "0 0 8px rgba(167,139,250,0.8)",
          }}
        />
      ))}

      {/* Vignette so content edges stay dark */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#09090b_100%)]" />
    </div>
  );
}
