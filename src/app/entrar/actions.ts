"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

async function callbackUrl() {
  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${origin}/auth/callback`;
}

export async function sendMagicLink(formData: FormData): Promise<ActionState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl() },
  });
  if (error) {
    if (error.status === 429) {
      return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    }
    return { error: "Não foi possível enviar o link. Tente novamente." };
  }
  // Mesma resposta exista a conta ou não.
  return { ok: "Enviamos um link de acesso. Abra seu e-mail neste aparelho." };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl() },
  });
  if (error || !data.url) redirect("/entrar?erro=google");
  redirect(data.url);
}
