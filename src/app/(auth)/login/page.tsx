"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/actions/auth";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const role = await getUserRole(data.user.id);
    if (role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Access denied. This portal is for administrators only.");
      return;
    }

    toast.success("Welcome back, Admin.");
    router.refresh();
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-ink-600 font-sans">
          Enter your admin credentials to access the dashboard.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-error-bg border border-error/20">
          <ShieldAlert size={16} className="text-error mt-0.5 shrink-0" />
          <p className="text-sm text-error font-sans">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="admin@symbodied.com"
          required
          autoComplete="email"
          leadingIcon={<Mail size={16} />}
        />
        <PasswordInput
          label="Password"
          name="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          leadingIcon={<Lock size={16} />}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
          Sign In to Admin
        </Button>
      </form>
    </div>
  );
}
