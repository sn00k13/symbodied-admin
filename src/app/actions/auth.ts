"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function getUserRole(userId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (data?.role as string) ?? "user";
}
