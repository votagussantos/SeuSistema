"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/data";
import { catalogTag } from "@/lib/public-catalog";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

// As funções admin_* no banco conferem de novo se quem chama é administrador.

const planSchema = z.object({
  ownerId: z.uuid(),
  planId: z.enum(["free", "pro"]),
  validUntil: z.iso.date().nullable(),
});

export async function setPlan(formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: "Sem permissão." };
  const parsed = planSchema.safeParse({
    ownerId: formData.get("owner_id"),
    planId: formData.get("plan_id"),
    validUntil: String(formData.get("valid_until") ?? "") || null,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_plan", {
    p_owner_id: parsed.data.ownerId,
    p_plan_id: parsed.data.planId,
    // Vale até o fim do dia informado.
    p_valid_until: parsed.data.validUntil ? `${parsed.data.validUntil}T23:59:59-03:00` : null,
  });
  if (error) return { error: "Não foi possível alterar o plano." };

  revalidatePath("/admin");
  return { ok: "Plano atualizado." };
}

const suspendSchema = z.object({
  catalogId: z.uuid(),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  suspended: z.boolean(),
  reason: z.string().max(300).nullable(),
});

export async function setSuspended(formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: "Sem permissão." };
  const parsed = suspendSchema.safeParse({
    catalogId: formData.get("catalog_id"),
    slug: formData.get("slug"),
    suspended: formData.get("suspended") === "true",
    reason: String(formData.get("reason") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspended", {
    p_catalog_id: parsed.data.catalogId,
    p_suspended: parsed.data.suspended,
    p_reason: parsed.data.reason,
  });
  if (error) return { error: "Não foi possível alterar a suspensão." };

  // Tira (ou devolve) a página pública imediatamente.
  updateTag(catalogTag(parsed.data.slug));
  revalidatePath("/admin");
  return { ok: parsed.data.suspended ? "Catálogo suspenso." : "Catálogo reativado." };
}
