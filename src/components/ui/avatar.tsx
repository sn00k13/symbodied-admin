import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  src?: string;
  size?: Size;
  ring?: boolean;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = "md", ring = false, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        "bg-brand-light text-brand font-sans font-semibold flex-shrink-0",
        sizeStyles[size],
        ring && "ring-2 ring-brand ring-offset-2",
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span>{getInitials(name || "?")}</span>
      )}
    </div>
  );
}
