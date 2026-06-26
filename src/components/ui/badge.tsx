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
  brand: "bg-brand-light text-brand border-brand/20",
  gold: "bg-gold-light text-gold-dark border-gold/30",
  success: "bg-success-bg text-success-green border-success-green/20",
  error: "bg-error-bg text-error border-error/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  neutral: "bg-ink-100 text-ink-600 border-ink-200",
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
