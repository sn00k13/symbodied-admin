"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type CategoryRow = {
  id: string;
  name: string;
  created_at: string | null;
  created_by: string | null;
};

const th = "text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-[#668074] border-b border-ink-200 dark:border-[#263a2b] bg-ink-100 dark:bg-[#1b2d20] font-sans";
const td = "px-5 py-4 text-sm text-ink-600 dark:text-[#89a895] border-b border-ink-200 dark:border-[#263a2b] font-sans";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, created_at, created_by")
      .order("name", { ascending: true });
    setCategories((data as CategoryRow[]) ?? []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("categories").insert({ name }).select().single();
    if (error) {
      toast.error("Failed to add category: " + error.message);
    } else {
      setCategories((prev) => [...prev, data as CategoryRow].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      toast.success(`Category "${name}" added.`);
    }
    setAdding(false);
  };

  const startEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    const name = editValue.trim();
    if (!name) return cancelEdit();
    const original = categories.find((c) => c.id === id);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    setEditingId(null);
    const supabase = createClient();
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
    if (error) {
      if (original) setCategories((prev) => prev.map((c) => (c.id === id ? original : c)));
      toast.error("Failed to update category.");
    } else {
      toast.success("Category updated.");
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) {
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      toast.error("Failed to delete category.");
    } else {
      toast.success(`"${cat.name}" deleted.`);
    }
  };

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Add new category */}
      <Card padding="md">
        <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3] mb-4">Add New Category</h3>
        <div className="flex gap-3 max-w-lg">
          <div className="flex-1">
            <Input
              placeholder="Category name (e.g. Agriculture)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button
            variant="primary"
            leadingIcon={<Plus size={16} />}
            onClick={handleAdd}
            loading={adding}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </div>
      </Card>

      {/* Categories table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center justify-between">
          <h3 className="font-sans font-bold text-base text-ink dark:text-[#dceee3]">All Categories</h3>
          <span className="text-xs text-ink-500 dark:text-[#668074] font-sans">{categories.length} total</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-400 font-sans text-center">No categories yet. Add one above.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Name</th>
                  <th className={th}>Created</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, i) => (
                  <tr key={cat.id} className="hover:bg-ink-100 dark:hover:bg-[#1b2d20] transition-colors">
                    <td className={td}>
                      <span className="text-ink-400 dark:text-[#4d6356] font-mono text-xs">{i + 1}</span>
                    </td>
                    <td className={`${td} font-semibold text-ink dark:text-[#dceee3]`}>
                      {editingId === cat.id ? (
                        <input
                          ref={editRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(cat.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full border border-brand rounded-lg px-3 py-1.5 text-sm text-ink dark:text-[#dceee3] bg-white dark:bg-[#1b2d20] font-sans focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className={td}>{formatDate(cat.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex gap-1">
                        {editingId === cat.id ? (
                          <>
                            <Button variant="primary" size="sm" leadingIcon={<Check size={13} />} onClick={() => saveEdit(cat.id)}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                              <X size={14} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              leadingIcon={<Pencil size={13} />}
                              onClick={() => startEdit(cat)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-error hover:bg-error-bg"
                              leadingIcon={<Trash2 size={13} />}
                              onClick={() => handleDelete(cat)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
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
