import { TrendingUp, Users, ShoppingBag, Wallet, HeartHandshake } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { naira, formatDate } from "@/lib/utils";
import { createServiceClient } from "@/lib/supabase/service";

const PROGRAM_COLORS: Record<string, string> = {
  Agriculture: "#1A6B3C",
  Textile: "#2E9B5A",
  Medicine: "#F5C518",
  Technology: "#9AA3AE",
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-[#668074] border-b border-ink-200 dark:border-[#263a2b] bg-ink-100 dark:bg-[#1b2d20] font-sans";
const td = "px-5 py-4 text-sm text-ink-600 dark:text-[#89a895] border-b border-ink-200 dark:border-[#263a2b] font-sans";

export default async function AdminAnalyticsPage() {
  const supabase = createServiceClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    return d;
  });

  const [
    { count: userCount },
    { count: vendorCount },
    { data: allOrders },
    { data: weekOrders },
    { data: productRows },
    { data: topProducts },
    { data: donations },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor"),
    supabase.from("orders").select("total, vendor, status, created_at"),
    supabase.from("orders").select("created_at").gte("created_at", weekAgo.toISOString()),
    supabase.from("products").select("category"),
    supabase.from("products").select("name, category, no_sold, price").order("no_sold", { ascending: false }).limit(10),
    supabase.from("donations").select("amount, created_at").gte("created_at", monthStart),
  ]);

  const monthOrders = (allOrders ?? []).filter((o) => o.created_at && o.created_at >= monthStart);
  const monthRevenue = monthOrders.reduce((s, o) => s + ((o.total as number) ?? 0), 0);
  const allTimeGMV = (allOrders ?? []).reduce((s, o) => s + ((o.total as number) ?? 0), 0);
  const monthDonations = (donations ?? []).reduce((s, d) => s + ((d.amount as number) ?? 0), 0);

  // Weekly bar chart
  const weeklyData = last7.map((d) => {
    const dayStr = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: (weekOrders ?? []).filter((o) => (o.created_at as string)?.slice(0, 10) === dayStr).length,
    };
  });
  const maxCount = Math.max(...weeklyData.map((w) => w.count), 1);

  // Products by program
  const catMap: Record<string, number> = {};
  (productRows ?? []).forEach((p) => {
    const c = (p.category as string) ?? "Other";
    catMap[c] = (catMap[c] ?? 0) + 1;
  });
  const catTotal = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
  const cats = Object.entries(catMap)
    .map(([n, v]) => ({ n, v: Math.round((v / catTotal) * 100), color: PROGRAM_COLORS[n] ?? "#9AA3AE" }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  // Top vendors by GMV
  const vendorMap: Record<string, { gmv: number; orders: number }> = {};
  (allOrders ?? []).forEach((o) => {
    const name = (o.vendor as string) ?? "Unknown";
    if (!vendorMap[name]) vendorMap[name] = { gmv: 0, orders: 0 };
    vendorMap[name].gmv += (o.total as number) ?? 0;
    vendorMap[name].orders += 1;
  });
  const topVendors = Object.entries(vendorMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 5);

  const dateLabel = `${last7[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${last7[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* KPI Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Members"
          value={userCount != null ? userCount.toLocaleString() : "—"}
          icon={<Users size={18} />}
          iconVariant="green"
        />
        <StatCard
          label="Total Vendors"
          value={vendorCount != null ? vendorCount.toLocaleString() : "—"}
          icon={<Users size={18} />}
          iconVariant="blue"
        />
        <StatCard
          label="Revenue (this month)"
          value={monthRevenue > 0 ? naira(monthRevenue) : "—"}
          icon={<Wallet size={18} />}
          iconVariant="gold"
        />
        <StatCard
          label="GMV (all time)"
          value={allTimeGMV > 0 ? naira(allTimeGMV) : "—"}
          icon={<TrendingUp size={18} />}
          iconVariant="green"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <StatCard
          label="Orders This Month"
          value={monthOrders.length.toLocaleString()}
          icon={<ShoppingBag size={18} />}
          iconVariant="purple"
        />
        <StatCard
          label="Orders This Week"
          value={(weekOrders?.length ?? 0).toLocaleString()}
          icon={<ShoppingBag size={18} />}
          iconVariant="blue"
        />
        <StatCard
          label="Donations This Month"
          value={monthDonations > 0 ? naira(monthDonations) : "—"}
          icon={<HeartHandshake size={18} />}
          iconVariant="gold"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center justify-between">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Orders This Week</h3>
            <span className="text-xs text-ink-500 dark:text-[#668074] font-sans">{dateLabel}</span>
          </div>
          <div className="p-6 flex items-end gap-4 h-52">
            {weeklyData.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                {w.count > 0 && <span className="text-xs text-ink-500 dark:text-[#668074] font-sans">{w.count}</span>}
                <div
                  className="w-full max-w-9 rounded-t-md"
                  style={{
                    height: `${(w.count / maxCount) * 100}%`,
                    minHeight: w.count > 0 ? "6px" : "3px",
                    background: w.count > 0 ? "linear-gradient(180deg, #2E9B5A, #1A6B3C)" : "var(--border-subtle)",
                  }}
                />
                <span className="text-xs text-ink-400 dark:text-[#4d6356] font-sans">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Products by Program</h3>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {cats.length > 0 ? cats.map((c) => (
              <div key={c.n}>
                <div className="flex justify-between text-sm mb-1.5 font-sans">
                  <span className="text-ink-600 dark:text-[#89a895]">{c.n}</span>
                  <strong className="text-ink dark:text-[#dceee3]">{c.v}%</strong>
                </div>
                <div className="h-2 bg-ink-200 dark:bg-[#263a2b] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.v}%`, background: c.color }} />
                </div>
              </div>
            )) : (
              <p className="text-sm text-ink-400 dark:text-[#4d6356] font-sans">No product data yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Top vendors */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
          <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Top Vendors by GMV</h3>
        </div>
        <div className="overflow-x-auto">
          {topVendors.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Vendor</th>
                  <th className={th}>Orders</th>
                  <th className={th}>Total GMV</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map((v, i) => (
                  <tr key={v.name} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                    <td className={td}><span className="text-ink-400 dark:text-[#4d6356] font-mono text-xs">{i + 1}</span></td>
                    <td className={`${td} font-semibold text-ink dark:text-[#dceee3]`}>{v.name}</td>
                    <td className={td}>{v.orders}</td>
                    <td className={`${td} font-semibold text-brand dark:text-[#2E9B5A]`}>{naira(v.gmv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-8 text-sm text-ink-400 dark:text-[#4d6356] font-sans text-center">No order data yet.</p>
          )}
        </div>
      </Card>

      {/* Top products */}
      {topProducts && topProducts.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
            <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">Top Products by Units Sold</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={th}>Price</th>
                  <th className={th}>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const prod = p as { name: string | null; category: string | null; no_sold: number | null; price: number | null };
                  return (
                    <tr key={i} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                      <td className={td}><span className="text-ink-400 dark:text-[#4d6356] font-mono text-xs">{i + 1}</span></td>
                      <td className={`${td} font-semibold text-ink dark:text-[#dceee3]`}>{prod.name ?? "—"}</td>
                      <td className={td}>{prod.category ?? "—"}</td>
                      <td className={td}>{prod.price != null ? naira(prod.price) : "—"}</td>
                      <td className={`${td} font-semibold text-brand dark:text-[#2E9B5A]`}>{prod.no_sold ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
