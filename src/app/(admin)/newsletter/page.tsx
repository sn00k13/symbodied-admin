"use client";

import { useState, useTransition } from "react";
import { Send, Users, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { sendNewsletter, type SendResult } from "@/app/actions/newsletter";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function NewsletterPage() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SendResult | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    body: "",
    ctaText: "",
    ctaUrl: "",
  });

  useEffect(() => {
    createClient()
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .then(({ count }) => setActiveCount(count ?? 0));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSend = () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    if (!confirm(`Send this newsletter to ${activeCount ?? "all"} active subscribers? This cannot be undone.`)) return;

    setResult(null);
    startTransition(async () => {
      const data = new FormData();
      data.set("subject", form.subject);
      data.set("body", form.body);
      data.set("ctaText", form.ctaText);
      data.set("ctaUrl", form.ctaUrl);
      const res = await sendNewsletter(data);
      setResult(res);
      if (!res.error && res.sent > 0) {
        setForm({ subject: "", body: "", ctaText: "", ctaUrl: "" });
      }
    });
  };

  const bodyPreviewHtml = form.body
    .split(/\n\n+/)
    .map((p) => `<p class="mb-4 text-sm text-white/65 leading-relaxed">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const ready = form.subject.trim() && form.body.trim();

  return (
    <div className="p-7 flex flex-col gap-6 max-w-4xl">

      {/* Stat bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-light dark:bg-[#112618] flex items-center justify-center shrink-0">
            <Users size={18} className="text-brand" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">
              {activeCount === null ? "—" : activeCount}
            </div>
            <div className="text-xs text-ink-500 dark:text-[#668074] font-sans mt-0.5">Active subscribers</div>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gold-light flex items-center justify-center shrink-0">
            <Send size={18} className="text-gold-dark" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">
              {result?.sent ?? "—"}
            </div>
            <div className="text-xs text-ink-500 dark:text-[#668074] font-sans mt-0.5">Sent this session</div>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-error-bg flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-error" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-ink dark:text-[#dceee3] leading-none">
              {result?.failed ?? "—"}
            </div>
            <div className="text-xs text-ink-500 dark:text-[#668074] font-sans mt-0.5">Failed this session</div>
          </div>
        </Card>
      </div>

      {/* Send result banner */}
      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border font-sans text-sm ${
          result.error
            ? "bg-error-bg border-error/20 text-error"
            : "bg-success-bg border-success-green/20 text-success-green"
        }`}>
          {result.error
            ? <AlertCircle size={16} className="shrink-0 mt-0.5" />
            : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
          <span>
            {result.error
              ? result.error
              : `Newsletter sent to ${result.sent} of ${result.total} subscribers.${result.failed > 0 ? ` ${result.failed} failed.` : ""}`}
          </span>
        </div>
      )}

      {/* Compose + preview split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Compose form */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b] flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-ink dark:text-[#dceee3]">Compose</h2>
            <button
              onClick={() => setPreview((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-[#668074] hover:text-ink dark:hover:text-[#dceee3] transition-colors font-sans"
            >
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              {preview ? "Hide preview" : "Show preview"}
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <Input
              label="Subject line"
              placeholder="What's this newsletter about?"
              value={form.subject}
              onChange={set("subject")}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink dark:text-[#dceee3] font-sans">Body</label>
              <textarea
                rows={10}
                placeholder={"Write your newsletter content here.\n\nSeparate paragraphs with a blank line.\n\nEach paragraph will be styled automatically in the email."}
                value={form.body}
                onChange={set("body")}
                className="w-full rounded-lg border border-ink-200 dark:border-[#263a2b] bg-white dark:bg-[#162018] text-sm text-ink dark:text-[#dceee3] placeholder:text-ink-400 dark:placeholder:text-[#4d6356] px-4 py-3 font-sans leading-relaxed resize-y focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="text-xs text-ink-400 dark:text-[#4d6356] font-sans">Blank lines create paragraph breaks.</p>
            </div>

            <div className="border-t border-ink-200 dark:border-[#263a2b] pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 dark:text-[#4d6356] font-sans mb-3">
                Optional CTA Button
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Button label e.g. Read the story"
                  value={form.ctaText}
                  onChange={set("ctaText")}
                />
                <Input
                  type="url"
                  placeholder="https://symbodied.com/..."
                  value={form.ctaUrl}
                  onChange={set("ctaUrl")}
                />
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="primary"
                size="md"
                fullWidth
                leadingIcon={<Send size={15} />}
                loading={isPending}
                disabled={!ready || isPending}
                onClick={handleSend}
              >
                {isPending
                  ? "Sending…"
                  : `Send to ${activeCount === null ? "…" : activeCount} subscribers`}
              </Button>
              <p className="mt-2 text-xs text-ink-400 dark:text-[#4d6356] font-sans text-center">
                Each email includes a personalised unsubscribe link.
              </p>
            </div>
          </div>
        </Card>

        {/* Live preview */}
        {preview && (
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-ink-200 dark:border-[#263a2b]">
              <h2 className="font-display font-bold text-base text-ink dark:text-[#dceee3]">Email Preview</h2>
              <p className="text-xs text-ink-500 dark:text-[#668074] font-sans mt-0.5">Approximate rendering — final appearance may vary by email client.</p>
            </div>
            <div className="p-4 bg-[#f4f1eb] dark:bg-[#f4f1eb] min-h-[400px]">
              <div className="rounded-xl overflow-hidden max-w-md mx-auto shadow-md">
                {/* Header */}
                <div className="bg-[#1a2e1c] px-6 py-6 text-center">
                  <div className="inline-block w-16 h-16 rounded-full bg-white/10 border border-white/25 mb-3" style={{lineHeight:"64px"}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://res.cloudinary.com/dbfcs4uvj/image/upload/v1782586720/logo_t5fydz.png"
                         width="36" height="36" alt="Symbodied"
                         className="inline-block align-middle" />
                  </div>
                  <p className="text-[#f0c060] font-bold tracking-widest text-xs uppercase">SYMBODIED</p>
                  <p className="text-white/40 text-[10px] tracking-widest uppercase mt-1">Tradition · Heritage · Identity</p>
                </div>
                {/* Gold line */}
                <div className="bg-[#1a2e1c] px-6">
                  <div className="h-[2px] bg-gradient-to-r from-[#f0c060] via-[#d4a840] to-[#f0c060] rounded-full" />
                </div>
                {/* Body */}
                <div className="bg-[#1a2e1c] px-6 py-7">
                  <p className="text-[#dceee3] font-bold text-lg leading-snug mb-4">
                    {form.subject || <span className="text-white/20 italic">Subject line</span>}
                  </p>
                  {form.body
                    ? <div dangerouslySetInnerHTML={{ __html: bodyPreviewHtml }} />
                    : <p className="text-white/20 text-sm italic">Your newsletter content will appear here…</p>}
                  {form.ctaText && (
                    <div className="mt-4">
                      <span className="inline-block bg-[#f0c060] text-[#1a1a1a] font-bold text-sm px-6 py-3 rounded-lg">
                        {form.ctaText} →
                      </span>
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="bg-[#f4f1eb] px-6 py-4 text-center">
                  <p className="text-[10px] text-[#9a9286]">© 2026 Symbodied LLC &nbsp;|&nbsp; <span className="underline">Unsubscribe</span></p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
