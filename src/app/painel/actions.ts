"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { requireCatalog } from "@/lib/data";
import { parseBRL } from "@/lib/money";
import { catalogTag } from "@/lib/public-catalog";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

// Toda action revalida a sessão (requireUser/requireCatalog) e filtra pelo
// catálogo do usuário; o RLS no banco é a segunda barreira.

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const optional = (fd: FormData, name: string) => text(fd, name) || null;
const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Dados inválidos.";
// Atualiza o painel e derruba o cache da página pública do catálogo.
function refresh(slug: string) {
  revalidatePath("/painel", "layout");
  updateTag(catalogTag(slug));
}

type DbError = { code?: string; message: string };

function dbMessage(error: DbError): string {
  if (error.message.includes("plan_limit_catalogs"))
    return "Seu plano permite apenas um catálogo.";
  if (error.message.includes("plan_limit_items"))
    return "Você atingiu o limite de itens do seu plano.";
  if (error.message.includes("plan_limit_images"))
    return "Você atingiu o limite de fotos por item do seu plano.";
  if (error.code === "23505") return "Esse endereço já está em uso. Escolha outro.";
  if (error.message.includes("catalogs_slug_not_reserved"))
    return "Esse endereço é reservado. Escolha outro.";
  return "Não foi possível salvar. Tente novamente.";
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const createCatalogSchema = z.object({
  name: z.string().min(1, "Informe o nome do negócio.").max(80, "Nome muito longo."),
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
      "O endereço deve ter de 3 a 40 letras, números ou hífens.",
    ),
});

export async function createCatalog(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = text(formData, "name");
  const parsed = createCatalogSchema.safeParse({
    name,
    slug: slugify(text(formData, "slug") || name),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogs")
    .insert({ ...parsed.data, owner_id: user.id });
  if (error) return { error: dbMessage(error) };

  refresh(parsed.data.slug);
  return { ok: "Catálogo criado." };
}

const infoSchema = z.object({
  name: z.string().min(1, "Informe o nome do negócio.").max(80, "Nome muito longo."),
  description: z.string().max(500, "Descrição muito longa.").nullable(),
  whatsapp: z
    .string()
    .regex(/^\d{10,15}$/, "WhatsApp inválido. Use DDD + número.")
    .nullable(),
  instagram: z
    .string()
    .regex(/^[A-Za-z0-9._]{1,30}$/, "Instagram inválido. Informe só o nome de usuário.")
    .nullable(),
  contact_email: z.email("E-mail de contato inválido.").max(254).nullable(),
  address: z.string().max(200, "Endereço muito longo.").nullable(),
  city: z.string().max(80, "Cidade muito longa.").nullable(),
  published: z.boolean(),
});

function normalizeWhatsapp(input: string | null) {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  // Número brasileiro sem DDI: acrescenta 55
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export async function updateCatalogInfo(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const parsed = infoSchema.safeParse({
    name: text(formData, "name"),
    description: optional(formData, "description"),
    whatsapp: normalizeWhatsapp(optional(formData, "whatsapp")),
    instagram: optional(formData, "instagram")?.replace(/^@/, "") ?? null,
    contact_email: optional(formData, "contact_email"),
    address: optional(formData, "address"),
    city: optional(formData, "city"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (parsed.data.published && !parsed.data.whatsapp) {
    return { error: "Informe o WhatsApp antes de publicar: é por ele que chegam os pedidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("catalogs").update(parsed.data).eq("id", catalog.id);
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  return { ok: "Salvo." };
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.");
const appearanceSchema = z.object({
  layout: z.enum(["grade", "lista", "destaque"], "Layout inválido."),
  color_primary: hex,
  color_background: hex,
  color_text: hex,
});

export async function updateAppearance(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const parsed = appearanceSchema.safeParse({
    layout: text(formData, "layout"),
    color_primary: text(formData, "color_primary"),
    color_background: text(formData, "color_background"),
    color_text: text(formData, "color_text"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("catalogs").update(parsed.data).eq("id", catalog.id);
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  return { ok: "Salvo." };
}

// Caminho de imagem aceito: {catalog_id}/.../arquivo.(webp|jpg|png)
function isOwnMediaPath(path: string, catalogId: string) {
  return (
    path.length <= 300 &&
    path.startsWith(`${catalogId}/`) &&
    /^[a-z0-9/-]+\.(webp|jpg|png)$/.test(path)
  );
}

export async function setCatalogImage(
  kind: "logo" | "cover",
  path: string,
): Promise<ActionState> {
  const catalog = await requireCatalog();
  if (kind !== "logo" && kind !== "cover") return { error: "Imagem inválida." };
  if (!isOwnMediaPath(path, catalog.id)) return { error: "Imagem inválida." };

  const column = kind === "logo" ? "logo_path" : "cover_path";
  const previous = catalog[column];
  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogs")
    .update({ [column]: path })
    .eq("id", catalog.id);
  if (error) return { error: dbMessage(error) };
  if (previous && previous !== path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([previous]);
  }

  refresh(catalog.slug);
  return { ok: "Imagem atualizada." };
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

const categoryName = z
  .string()
  .min(1, "Informe o nome da categoria.")
  .max(60, "Nome muito longo.");
const uuid = z.uuid("Identificador inválido.");

export async function createCategory(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const name = categoryName.safeParse(text(formData, "name"));
  if (!name.success) return { error: firstIssue(name.error) };

  const supabase = await createClient();
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("catalog_id", catalog.id);
  if ((count ?? 0) >= 50) return { error: "Limite de 50 categorias atingido." };

  const { error } = await supabase
    .from("categories")
    .insert({ catalog_id: catalog.id, name: name.data, position: count ?? 0 });
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  return null;
}

export async function renameCategory(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  const name = categoryName.safeParse(text(formData, "name"));
  if (!id.success) return { error: firstIssue(id.error) };
  if (!name.success) return { error: firstIssue(name.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: name.data })
    .eq("id", id.data)
    .eq("catalog_id", catalog.id);
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  return { ok: "Salvo." };
}

export async function deleteCategory(formData: FormData) {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id.data).eq("catalog_id", catalog.id);
  refresh(catalog.slug);
}

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

const variationsSchema = z
  .array(
    z.object({
      group_name: z.string().trim().min(1, "Informe o tipo da variação.").max(40),
      label: z.string().trim().min(1, "Informe a opção da variação.").max(60),
      price: z.string().trim().max(20),
    }),
  )
  .max(30, "Limite de 30 variações por item.");

const itemSchema = z.object({
  type: z.enum(["product", "service"], "Tipo inválido."),
  name: z.string().min(1, "Informe o nome.").max(120, "Nome muito longo."),
  description: z.string().max(2000, "Descrição muito longa.").nullable(),
  category_id: uuid.nullable(),
  duration_minutes: z
    .number("Duração inválida.")
    .int("Duração inválida.")
    .min(1, "Duração inválida.")
    .max(100000, "Duração inválida.")
    .nullable(),
});

export async function saveItem(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();

  const idText = text(formData, "id");
  const id = idText ? uuid.safeParse(idText) : null;
  if (id && !id.success) return { error: firstIssue(id.error) };

  const durationText = text(formData, "duration_minutes");
  const parsed = itemSchema.safeParse({
    type: text(formData, "type"),
    name: text(formData, "name"),
    description: optional(formData, "description"),
    category_id: optional(formData, "category_id"),
    duration_minutes: durationText ? Number(durationText) : null,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const onRequest = formData.get("price_on_request") === "on";
  const price = onRequest ? null : parseBRL(text(formData, "price"));
  const promo = onRequest ? null : parseBRL(text(formData, "promo_price"));
  if (!onRequest && price === null) return { error: "Informe o preço ou marque “sob consulta”." };
  if (Number.isNaN(price) || Number.isNaN(promo)) return { error: "Preço inválido. Ex.: 49,90" };
  if (price !== null && price > 100_000_000) return { error: "Preço muito alto." };
  if (promo !== null && price !== null && promo >= price) {
    return { error: "O preço promocional deve ser menor que o preço." };
  }

  let rawVariations: unknown;
  try {
    rawVariations = JSON.parse(text(formData, "variations") || "[]");
  } catch {
    return { error: "Variações inválidas." };
  }
  const variations = variationsSchema.safeParse(rawVariations);
  if (!variations.success) return { error: firstIssue(variations.error) };
  const variationRows = [];
  for (const [position, v] of variations.data.entries()) {
    const cents = parseBRL(v.price);
    if (Number.isNaN(cents)) return { error: `Preço inválido na variação “${v.label}”.` };
    variationRows.push({
      group_name: v.group_name,
      label: v.label,
      price_cents: cents,
      position,
    });
  }

  const row = {
    ...parsed.data,
    duration_minutes: parsed.data.type === "service" ? parsed.data.duration_minutes : null,
    price_cents: price,
    promo_price_cents: promo,
    price_on_request: onRequest,
    price_is_from: !onRequest && formData.get("price_is_from") === "on",
    available: formData.get("available") === "on",
  };

  const supabase = await createClient();
  let itemId: string;
  if (id) {
    const { data, error } = await supabase
      .from("items")
      .update(row)
      .eq("id", id.data)
      .eq("catalog_id", catalog.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: dbMessage(error) };
    if (!data) return { error: "Item não encontrado." };
    itemId = data.id;
  } else {
    const { data, error } = await supabase
      .from("items")
      .insert({ ...row, catalog_id: catalog.id })
      .select("id")
      .single();
    if (error) return { error: dbMessage(error) };
    itemId = data.id;
  }

  // Variações: substitui o conjunto inteiro.
  const { error: deleteError } = await supabase
    .from("item_variations")
    .delete()
    .eq("item_id", itemId)
    .eq("catalog_id", catalog.id);
  if (deleteError) return { error: dbMessage(deleteError) };
  if (variationRows.length > 0) {
    const { error } = await supabase.from("item_variations").insert(
      variationRows.map((v) => ({ ...v, item_id: itemId, catalog_id: catalog.id })),
    );
    if (error) return { error: dbMessage(error) };
  }

  refresh(catalog.slug);
  if (!id) redirect(`/painel/itens/${itemId}`);
  return { ok: "Salvo." };
}

export async function deleteItem(formData: FormData) {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data: images } = await supabase
    .from("item_images")
    .select("path")
    .eq("item_id", id.data)
    .eq("catalog_id", catalog.id);
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id.data)
    .eq("catalog_id", catalog.id);
  if (!error && images && images.length > 0) {
    await supabase.storage.from(MEDIA_BUCKET).remove(images.map((i) => i.path));
  }

  refresh(catalog.slug);
  redirect("/painel/itens");
}

export async function addItemImage(itemId: string, path: string): Promise<ActionState> {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(itemId);
  if (!id.success || !isOwnMediaPath(path, catalog.id)) return { error: "Imagem inválida." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("item_images")
    .select("id", { count: "exact", head: true })
    .eq("item_id", id.data);
  const { error } = await supabase.from("item_images").insert({
    item_id: id.data,
    catalog_id: catalog.id,
    path,
    position: count ?? 0,
  });
  if (error) {
    // Não deixa arquivo órfão no Storage se o banco recusou (ex.: limite do plano).
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return { error: dbMessage(error) };
  }

  refresh(catalog.slug);
  return null;
}

export async function deleteItemImage(formData: FormData) {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("item_images")
    .delete()
    .eq("id", id.data)
    .eq("catalog_id", catalog.id)
    .select("path")
    .maybeSingle();
  if (data) await supabase.storage.from(MEDIA_BUCKET).remove([data.path]);
  refresh(catalog.slug);
}
