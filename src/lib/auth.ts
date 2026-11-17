import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type User = { id: string; email: string | null };

// Lê e valida o token da sessão. Uma vez por requisição.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}
