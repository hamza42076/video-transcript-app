"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
};

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap select-none transition-[background-color,border-color,box-shadow,color] duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-accent-soft to-accent text-white border border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset] hover:from-[#b19bfd] hover:to-[#9165f7]",
  secondary:
    "bg-white/4 text-foreground border border-line hover:bg-white/7 hover:border-line-strong",
  ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/5",
  danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, glow, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        glow && variant === "primary" ? "shadow-glow hover:shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_10px_50px_-6px_rgba(139,92,246,0.6)]" : ""
      } ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
});

export default Button;
