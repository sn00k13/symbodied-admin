import { cn } from "@/lib/utils";

type Padding = "none" | "sm" | "md" | "lg";

interface CardProps {
  hoverable?: boolean;
  padding?: Padding;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingStyles: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ hoverable = false, padding = "md", className, children, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "bg-white dark:bg-[#162018] rounded-xl border border-ink-200 dark:border-[#263a2b]",
        "shadow-[var(--shadow-sm)]",
        hoverable && "transition-all duration-200 cursor-pointer hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
