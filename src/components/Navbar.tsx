"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, Menu, Upload, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/transcribe", label: "Transcribe" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40">
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass border-x-0 border-t-0"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 shadow-glow">
              <AudioLines className="size-4 text-white" aria-hidden />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Transcript<span className="text-accent-soft">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-lg px-3.5 py-2 text-sm transition-colors ${
                      active ? "text-foreground" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-white/6"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/transcribe"
              className="hidden h-9 items-center gap-2 rounded-lg bg-gradient-to-b from-accent-soft to-accent px-3.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] md:inline-flex"
            >
              <Upload className="size-4" aria-hidden />
              Upload Video
            </Link>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-white/6 hover:text-foreground md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line md:hidden"
            >
              <ul className="flex flex-col gap-1 px-4 py-3">
                {links.map((l, i) => {
                  const active = pathname === l.href;
                  return (
                    <motion.li
                      key={l.href}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link
                        href={l.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2.5 text-sm ${
                          active
                            ? "bg-white/6 text-foreground"
                            : "text-muted hover:bg-white/4 hover:text-foreground"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </motion.li>
                  );
                })}
                <motion.li
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * links.length }}
                  className="pt-2"
                >
                  <Link
                    href="/transcribe"
                    onClick={close}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-accent-soft to-accent text-sm font-medium text-white"
                  >
                    <Upload className="size-4" aria-hidden />
                    Upload Video
                  </Link>
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
