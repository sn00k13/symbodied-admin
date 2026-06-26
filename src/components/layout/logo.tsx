import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  inverse?: boolean;
  height?: number;
  markOnly?: boolean;
  className?: string;
}

export function Logo({ inverse = false, height = 36, markOnly = false, className }: LogoProps) {
  const mark = (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: height,
        height: height,
        background: inverse ? "rgba(255,255,255,0.18)" : "#E8F5EE",
        padding: Math.round(height * 0.1),
      }}
    >
      <Image
        src="/images/logo.png"
        alt="Symbodied logo"
        width={height - Math.round(height * 0.2)}
        height={height - Math.round(height * 0.2)}
        className="object-contain"
        priority
      />
    </span>
  );

  if (markOnly) return <span className={cn("inline-flex", className)}>{mark}</span>;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      <span
        className="font-display font-bold tracking-tight select-none"
        style={{
          fontSize: Math.round(height * 0.6),
          lineHeight: 1,
          color: inverse ? "#FFFFFF" : "#0F1A14",
        }}
      >
        Symbodied
      </span>
    </span>
  );
}
