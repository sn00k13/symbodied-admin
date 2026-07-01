"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { naira, formatDate } from "@/lib/utils";

type DonationRow = {
  id: string;
  project_name: string | null;
  donor_name: string | null;
  amount: number | null;
  currency: string | null;
  payment_ref: string | null;
  status: string;
  created_at: string | null;
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-[#668074] border-b border-ink-200 dark:border-[#263a2b] bg-ink-100 dark:bg-[#1b2d20] font-sans";
const td = "px-5 py-4 text-sm text-ink-600 dark:text-[#89a895] border-b border-ink-200 dark:border-[#263a2b] font-sans";

export default function AdminDonationsPage() {
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("donations")
      .select("id, project_name, donor_name, amount, currency, payment_ref, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as DonationRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.project_name ?? "").toLowerCase().includes(q) ||
      (r.donor_name ?? "").toLowerCase().includes(q) ||
      (r.payment_ref ?? "").toLowerCase().includes(q)
    );
  });

  const totalAmount = rows.reduce((s, r) => s + ((r.amount as number) ?? 0), 0);

  const stats = [
    { label: "Total Donations", value: rows.length },
    { label: "Total Raised", value: totalAmount > 0 ? naira(totalAmount) : "—" },
    { label: "Completed", value: rows.filter((r) => r.status === "completed").length },
    { label: "Pending", value: rows.filter((r) => r.status === "pending").length },
  ];

  return (
    <div className="p-7 flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} padding="md" className="text-center">
            <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">{loading ? "—" : s.value}</div>
            <div className="mt-1 text-xs text-ink-500 dark:text-[#668074] font-sans">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] max-w-sm">
          <Input
            placeholder="Search by project, donor or payment ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<Search size={15} />}
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading donations…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No donations found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Project</th>
                  <th className={th}>Donor</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Currency</th>
                  <th className={th}>Payment Ref</th>
                  <th className={th}>Date</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                    <td className={`${td} font-semibold text-ink dark:text-[#dceee3] max-w-48`}>
                      <span className="line-clamp-2">{r.project_name ?? "—"}</span>
                    </td>
                    <td className={td}>{r.donor_name ?? "—"}</td>
                    <td className={`${td} font-semibold text-brand`}>
                      {r.amount != null ? naira(r.amount) : "—"}
                    </td>
                    <td className={td}>{r.currency ?? "NGN"}</td>
                    <td className={td}>
                      {r.payment_ref ? (
                        <span className="font-mono text-xs">{r.payment_ref}</span>
                      ) : "—"}
                    </td>
                    <td className={td}>{formatDate(r.created_at)}</td>
                    <td className={td}><StatusBadge status={r.status} /></td>
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
