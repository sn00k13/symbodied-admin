"use client";

import { useEffect, useState } from "react";
import { Search, Package, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { naira, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ProductRow = {
  id: string;
  name: string | null;
  category: string | null;
  price: number | null;
  unit: string | null;
  quantity: number | null;
  active: boolean;
  created_at: string | null;
  vendor_id: string | null;
  vendor_name?: string | null;
  image_urls: string[] | null;
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 bg-ink-100 font-sans";
const td = "px-5 py-4 text-sm text-ink-600 border-b border-ink-200 font-sans";

const CATEGORIES = ["Agriculture", "Medicine", "Technology", "Textile", "Other"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("id, name, category, price, unit, quantity, active, created_at, vendor_id, image_urls")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as ProductRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (!search) return true;
    return (p.name ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const handleDelete = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      setProducts((prev) => [...prev, p]);
      toast.error("Failed to delete product.");
    } else {
      toast.success("Product deleted.");
    }
  };

  const toggleActive = async (p: ProductRow) => {
    const newActive = !p.active;
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: newActive } : x)));
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ active: newActive }).eq("id", p.id);
    if (error) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)));
      toast.error("Failed to update product.");
    } else {
      toast.success(newActive ? "Product activated." : "Product deactivated.");
    }
  };

  const stats = [
    { label: "Total", value: products.length },
    { label: "Active", value: products.filter((p) => p.active).length },
    { label: "Inactive", value: products.filter((p) => !p.active).length },
    { label: "Categories", value: new Set(products.map((p) => p.category).filter(Boolean)).size },
  ];

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

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 flex items-center gap-4 flex-wrap">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search size={15} />}
            />
          </div>
          <div className="flex items-center gap-1 bg-ink-100 rounded-lg p-1 flex-wrap">
            {(["all", ...CATEGORIES]).map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md font-sans transition-colors capitalize ${
                  catFilter === c ? "bg-white text-ink shadow-[var(--shadow-xs)]" : "text-ink-500 hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading products…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Package size={36} className="text-ink-300" />
              <p className="text-sm text-ink-400 font-sans">No products found.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={th}>Price</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Listed</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-100 transition-colors">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        {p.image_urls && p.image_urls[0] ? (
                          <img
                            src={p.image_urls[0]}
                            alt={p.name ?? ""}
                            className="h-10 w-10 rounded-lg object-cover border border-ink-200 shrink-0"
                          />
                        ) : (
                          <Avatar name={p.name ?? "P"} size="sm" />
                        )}
                        <span className="font-semibold text-ink text-sm line-clamp-2 max-w-40">{p.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className={td}>
                      {p.category ? (
                        <Badge tone="brand" size="sm">{p.category}</Badge>
                      ) : "—"}
                    </td>
                    <td className={`${td} font-semibold text-ink`}>
                      {p.price != null ? naira(p.price) : "—"}
                      {p.unit && <span className="text-xs text-ink-500 ml-1 font-normal">/{p.unit}</span>}
                    </td>
                    <td className={td}>{p.quantity != null ? p.quantity : "—"}</td>
                    <td className={td}>{formatDate(p.created_at, { day: "numeric", month: "short" })}</td>
                    <td className={td}>
                      <Badge tone={p.active ? "success" : "neutral"} size="sm">
                        {p.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={!p.active ? "text-success-green" : "text-ink-500"}
                          onClick={() => toggleActive(p)}
                        >
                          {p.active ? "Deactivate" : "Activate"}
                        </Button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink-500 hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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
