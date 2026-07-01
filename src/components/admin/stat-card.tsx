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
  green:  "bg-brand-light text-brand dark:bg-[#112618] dark:text-[#2E9B5A]",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  red:    "bg-error-bg text-error dark:bg-[#2c1414] dark:text-[#f87171]",
  blue:   "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  gold:   "bg-gold-light text-gold-dark dark:bg-[#2a1e00] dark:text-[#F5C518]",
};

const deltaToneStyles: Record<DeltaTone, string> = {
  default: "text-ink-500 dark:text-[#668074]",
  success: "text-success-green",
  error:   "text-error dark:text-[#f87171]",
  warning: "text-warning dark:text-[#fbbf24]",
};

export function StatCard({ label, value, delta, deltaTone = "default", icon, iconVariant = "green", className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-600 dark:text-[#89a895] font-sans">{label}</span>
        {icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconVariantStyles[iconVariant])}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-display font-bold text-3xl text-ink dark:text-[#dceee3] leading-none">{value}</span>
        {delta && (
          <span className={cn("text-xs font-sans", deltaToneStyles[deltaTone])}>{delta}</span>
        )}
      </div>
    </Card>
  );
}
