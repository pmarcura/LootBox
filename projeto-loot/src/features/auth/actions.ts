"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuthState = {
  status: "idle" | "error";
  message?: string;
};

const authSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

const LOGIN_RATE_LIMIT_WINDOW_MINUTES = 5;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

function hashForRateLimit(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function checkLoginRateLimit(email: string): Promise<void> {
  // Skip rate limiting if SUPABASE_SERVICE_ROLE_KEY is not set (dev mode)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashForRateLimit(ip);
  const emailHash = hashForRateLimit(email.toLowerCase());

  const admin = createSupabaseAdminClient();
  const since = new Date(
    Date.now() - LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: recentAttempts } = await admin
    .from("login_attempts")
    .select("id")
    .or(`ip_hash.eq.${ipHash},email_hash.eq.${emailHash}`)
    .gte("created_at", since);

  const count = recentAttempts?.length ?? 0;
  if (count >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    throw new Error("rate_limited");
  }

  await admin.from("login_attempts").insert({
    ip_hash: ipHash,
    email_hash: emailHash,
    success: false,
  });
}

function mapLoginError(errorMessage?: string): string {
  if (!errorMessage) return "Credenciais inválidas.";
  if (errorMessage.includes("rate_limited"))
    return "Muitas tentativas. Aguarde alguns minutos.";
  if (errorMessage.includes("Invalid login credentials"))
    return "Email ou senha incorretos.";
  if (errorMessage.includes("Email not confirmed"))
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  if (errorMessage.includes("User not found")) return "Conta não encontrada.";
  return "Credenciais inválidas. Verifique email e senha.";
}

function mapRegisterError(errorMessage?: string): string {
  if (!errorMessage) return "Falha ao criar conta.";
  if (errorMessage.includes("already registered"))
    return "Este email já está cadastrado. Faça login.";
  return "Falha ao criar conta. Tente novamente.";
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  try {
    await checkLoginRateLimit(parsed.data.email);
  } catch {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const msg = mapLoginError(error?.message);
    return { status: "error", message: msg };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  // Get redirect target from form or use defaults
  const redirectTo = formData.get("redirectTo") as string | null;

  if (profile?.is_admin && !redirectTo) {
    redirect("/admin");
  }

  redirect(redirectTo ?? "/gacha");
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: mapRegisterError(error.message) };
  }

  redirect("/login?created=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPasswordAction(
  _prevState: { status: "idle" | "success" | "error"; message?: string },
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message?: string }> {
  const email = formData.get("email");
  if (!email || typeof email !== "string") {
    return { status: "error", message: "Email inválido." };
  }

  const parsed = authSchema.pick({ email: true }).safeParse({ email });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://genesis-gilt-chi.vercel.app";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${baseUrl}/login/reset-password`,
  });

  if (error) {
    return {
      status: "error",
      message: "Falha ao enviar email. Tente novamente mais tarde.",
    };
  }

  return { status: "success" };
}
