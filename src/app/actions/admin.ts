"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function createAdminUser(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { error: error.message };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);
  if (profileError) return { error: profileError.message };
  return {};
}

export async function createRegularUser(
  email: string,
  password: string,
  role: "user" | "vendor"
): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { error: error.message };
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", data.user.id);
  if (profileError) return { error: profileError.message };
  return {};
}
