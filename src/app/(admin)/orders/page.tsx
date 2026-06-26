"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { naira, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  customer: string | null;
  vendor: string | null;
  product: string | null;
  total: number | null;
  created_at: string | null;
  status: string;
  payment_ref: string | null;
};

type StatusFilter = "all" | "processing" | "shipped" | "delivered" | "cancelled";

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("orders")
      .select("id, customer, vendor, product, total, created_at, status, payment_ref")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.customer ?? "").toLowerCase().includes(q) ||
      (o.vendor ?? "").toLowerCase().includes(q)
    );
  });

  const STATUSES: StatusFilter[] = ["all", "processing", "shipped", "delivered", "cancelled"];

  const stats = [
    { label: "Total", value: orders.length },
    { label: "Processing", value: orders.filter((o) => o.status === "processing").length },
    { label: "Shipped", value: orders.filter((o) => o.status === "shipped").length },
    { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length },
  ];

  const totalRevenue = orders.reduce((s, o) => s + ((o.total as number) ?? 0), 0);

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} padding="md" className="text-center">
            <div className="font-display font-bold text-3xl text-ink leading-none">
              {loading ? "—" : s.value}
            </div>
            <div className="mt-1 text-xs text-ink-500 font-sans">{s.label}</div>
          </Card>
        ))}
      </div>

      {totalRevenue > 0 && (
        <Card padding="md" className="bg-brand-deep border-brand-deep">
          <p className="text-sm text-white/70 font-sans">Total GMV (all orders)</p>
          <p className="font-display font-bold text-3xl text-gold mt-1">{naira(totalRevenue)}</p>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 flex items-center gap-4 flex-wrap">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Search by order ID, customer or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search size={15} />}
            />
          </div>
          <div className="flex items-center gap-1 text-sm font-sans text-ink-600">
            Filter:
            <div className="relative ml-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm font-semibold border border-ink-200 rounded-lg bg-white text-ink font-sans focus:outline-none focus:border-brand"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading orders…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No orders found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Order ID</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Vendor</th>
                  <th className={th}>Product</th>
                  <th className={th}>Total</th>
                  <th className={th}>Payment Ref</th>
                  <th className={th}>Date</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-ink-100 transition-colors">
                    <td className={td}>
                      <span className="font-mono text-xs font-semibold text-ink">{o.id.slice(0, 8)}…</span>
                    </td>
                    <td className={`${td} font-semibold text-ink`}>{o.customer ?? "—"}</td>
                    <td className={td}>{o.vendor ?? "—"}</td>
                    <td className={td}>
                      <span className="line-clamp-1 max-w-36">{o.product ?? "—"}</span>
                    </td>
                    <td className={`${td} font-semibold text-brand`}>
                      {o.total != null ? naira(o.total) : "—"}
                    </td>
                    <td className={td}>
                      {o.payment_ref ? (
                        <span className="font-mono text-xs">{o.payment_ref}</span>
                      ) : "—"}
                    </td>
                    <td className={td}>{formatDate(o.created_at)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
