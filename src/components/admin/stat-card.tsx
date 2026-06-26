import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconVariant = "green" | "purple" | "red" | "blue" | "gold";
type DeltaTone = "default" | "success" | "error" | "warning";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: DeltaTone;
  icon?: React.ReactNode;
  iconVariant?: IconVariant;
  className?: string;
}

const iconVariantStyles: Record<IconVariant, string> = {
  green:  "bg-brand-light text-brand",
  purple: "bg-purple-100 text-purple-600",
  red:    "bg-error-bg text-error",
  blue:   "bg-blue-100 text-blue-600",
  gold:   "bg-gold-light text-gold-dark",
};

const deltaToneStyles: Record<DeltaTone, string> = {
  default: "text-ink-500",
  success: "text-success-green",
  error:   "text-error",
  warning: "text-warning",
};

export function StatCard({ label, value, delta, deltaTone = "default", icon, iconVariant = "green", className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-600 font-sans">{label}</span>
        {icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconVariantStyles[iconVariant])}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-display font-bold text-3xl text-ink leading-none">{value}</span>
        {delta && (
          <span className={cn("text-xs font-sans", deltaToneStyles[deltaTone])}>{delta}</span>
        )}
      </div>
    </Card>
  );
}
