"use server";

import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { newsletterHtml } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Symbodied <newsletter@symbodied.com>";
const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://symbodied.com";

const BATCH_SIZE = 100;

export type SendResult = {
  sent: number;
  failed: number;
  total: number;
  error?: string;
};

export async function sendNewsletter(formData: FormData): Promise<SendResult> {
  const subject = (formData.get("subject") as string ?? "").trim();
  const body = (formData.get("body") as string ?? "").trim();
  const ctaText = (formData.get("ctaText") as string ?? "").trim();
  const ctaUrl = (formData.get("ctaUrl") as string ?? "").trim();

  if (!subject || !body) {
    return { sent: 0, failed: 0, total: 0, error: "Subject and body are required." };
  }

  const supabase = createServiceClient();

  const { data: subscribers, error: fetchError } = await supabase
    .from("subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "active");

  if (fetchError) {
    return { sent: 0, failed: 0, total: 0, error: "Failed to fetch subscribers." };
  }

  if (!subscribers || subscribers.length === 0) {
    return { sent: 0, failed: 0, total: 0, error: "No active subscribers found." };
  }

  const total = subscribers.length;
  let sent = 0;
  let failed = 0;

  // Chunk into batches of 100 (Resend batch limit)
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);

    const emails = chunk.map((sub) => ({
      from: FROM,
      to: sub.email,
      subject,
      html: newsletterHtml({
        subject,
        body,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        email: sub.email,
        unsubscribeUrl: `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}`,
      }),
    }));

    try {
      const { data, error } = await resend.batch.send(emails);
      if (error) {
        failed += chunk.length;
      } else {
        sent += data?.data?.length ?? chunk.length;
      }
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed, total };
}
