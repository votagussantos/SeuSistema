import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "./auth";
import { createClient } from "./supabase/server";
import type { Catalog, Plan } from "./types";

// Catálogo do usuário logado (por enquanto, um por conta).
export const getMyCatalog = cache(async (): Promise<Catalog | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogs")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export async function requireCatalog(): Promise<Catalog> {
  const catalog = await getMyCatalog();
  if (!catalog) redirect("/painel");
  return catalog;
}

export const getMyPlan = cache(async (): Promise<Plan> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("account_plans")
    .select("plan_id, valid_until")
    .eq("user_id", user.id)
    .maybeSingle();
  const active =
    account && (!account.valid_until || new Date(account.valid_until) > new Date());
  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", active ? account.plan_id : "free")
    .single();
  if (error) throw new Error(error.message);
  return plan;
});

// Catálogo suspenso pela administração: fica fora do ar mesmo publicado.
export const getMySuspension = cache(async (catalogId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_suspensions")
    .select("reason")
    .eq("catalog_id", catalogId)
    .maybeSingle();
  return data;
});

export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
});
