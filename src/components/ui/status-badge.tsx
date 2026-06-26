import { Badge } from "./badge";

const statusMap: Record<string, { tone: "brand" | "gold" | "success" | "error" | "warning" | "neutral"; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  processing: { tone: "gold", label: "Processing" },
  shipped: { tone: "brand", label: "Shipped" },
  delivered: { tone: "success", label: "Delivered" },
  cancelled: { tone: "error", label: "Cancelled" },
  active: { tone: "success", label: "Active" },
  inactive: { tone: "neutral", label: "Inactive" },
  suspended: { tone: "error", label: "Suspended" },
  approved: { tone: "success", label: "Approved" },
  rejected: { tone: "error", label: "Rejected" },
  draft: { tone: "neutral", label: "Draft" },
  published: { tone: "success", label: "Published" },
  archived: { tone: "neutral", label: "Archived" },
  completed: { tone: "success", label: "Completed" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { tone, label } = statusMap[status?.toLowerCase()] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={tone} size="sm" className={className}>{label}</Badge>;
}
