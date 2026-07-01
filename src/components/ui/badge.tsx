import { cn } from "@/lib/utils";

type Tone = "brand" | "gold" | "success" | "error" | "warning" | "neutral";
type Size = "sm" | "md";

interface BadgeProps {
  tone?: Tone;
  size?: Size;
  leadingIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  brand:   "bg-brand-light text-brand border-brand/20 dark:bg-[#112618] dark:text-[#2E9B5A] dark:border-[#263a2b]",
  gold:    "bg-gold-light text-gold-dark border-gold/30 dark:bg-[#2a1e00] dark:text-[#F5C518] dark:border-[#3d2c00]",
  success: "bg-success-bg text-success-green border-success-green/20 dark:bg-[#0d2418] dark:text-[#22c55e] dark:border-[#1a3d28]",
  error:   "bg-error-bg text-error border-error/20 dark:bg-[#2c1414] dark:text-[#f87171] dark:border-[#4a1e1e]",
  warning: "bg-warning-bg text-warning border-warning/20 dark:bg-[#2a1800] dark:text-[#fbbf24] dark:border-[#3d2400]",
  neutral: "bg-ink-100 text-ink-600 border-ink-200 dark:bg-[#1b2d20] dark:text-[#89a895] dark:border-[#263a2b]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export function Badge({ tone = "neutral", size = "md", leadingIcon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-sans font-semibold",
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
    >
      {leadingIcon}
      {children}
    </span>
  );
}
