"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { parseBRL } from "@/lib/money";
import { presets } from "@/lib/presets";
import { getSegment, segments } from "@/lib/segments";
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
  if (error.message.includes("category_depth_limit"))
    return "As categorias podem ter no máximo 5 níveis.";
  if (error.message.includes("category_cycle")) return "Categoria inválida.";
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

const segmentId = z
  .string()
  .refine((id) => segments.some((segment) => segment.id === id), "Escolha o segmento do seu negócio.");

const createCatalogSchema = z.object({
  name: z.string().min(1, "Informe o nome do negócio.").max(80, "Nome muito longo."),
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
      "O endereço deve ter de 3 a 40 letras, números ou hífens.",
    ),
  segment: segmentId,
});

export async function createCatalog(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = text(formData, "name");
  const parsed = createCatalogSchema.safeParse({
    name,
    slug: slugify(text(formData, "slug") || name),
    segment: text(formData, "segment"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // O segmento já define um visual de partida; o dono muda depois em Aparência.
  const segment = getSegment(parsed.data.segment);
  const preset = presets.find((p) => p.id === segment.presetId);
  const supabase = await createClient();
  const { error } = await supabase.from("catalogs").insert({
    ...parsed.data,
    owner_id: user.id,
    ...(preset && {
      layout: preset.layout,
      color_primary: preset.primary,
      color_background: preset.background,
      color_text: preset.text,
    }),
  });
  if (error) return { error: dbMessage(error) };

  refresh(parsed.data.slug);
  redirect(segment.categories.length > 0 ? "/painel/sugestoes" : "/painel");
}

export async function setSegment(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const parsed = segmentId.safeParse(text(formData, "segment"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogs")
    .update({ segment: parsed.data })
    .eq("id", catalog.id);
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  redirect(getSegment(parsed.data).categories.length > 0 ? "/painel/sugestoes" : "/painel");
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

const MAX_CATEGORIES = 100;
const PATH_SEPARATOR = " > ";

// Garante que cada caminho ("Bebidas" > "Sucos") exista, criando só o que falta.
// Devolve o id da última categoria de cada caminho.
async function ensureCategoryPaths(
  catalogId: string,
  paths: string[][],
  rootParentId: string | null = null,
): Promise<{ ids: Map<string, string>; created: number; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, name")
    .eq("catalog_id", catalogId);
  const all = data ?? [];
  const ids = new Map<string, string>();
  let created = 0;
  if (rootParentId && !all.some((c) => c.id === rootParentId)) {
    return { ids, created, error: "Categoria principal não encontrada." };
  }

  const key = (parentId: string | null, name: string) =>
    `${parentId ?? ""}|${name.toLocaleLowerCase("pt-BR")}`;
  const byKey = new Map(all.map((c) => [key(c.parent_id, c.name), c.id as string]));
  const siblingCount = new Map<string, number>();
  for (const c of all) {
    siblingCount.set(c.parent_id ?? "", (siblingCount.get(c.parent_id ?? "") ?? 0) + 1);
  }
  let total = all.length;

  for (const path of paths) {
    let parentId = rootParentId;
    for (const name of path) {
      let id = byKey.get(key(parentId, name));
      if (!id) {
        if (total >= MAX_CATEGORIES) {
          return { ids, created, error: `Limite de ${MAX_CATEGORIES} categorias atingido.` };
        }
        const position = siblingCount.get(parentId ?? "") ?? 0;
        const { data: row, error } = await supabase
          .from("categories")
          .insert({ catalog_id: catalogId, parent_id: parentId, name, position })
          .select("id")
          .single();
        if (error) return { ids, created, error: dbMessage(error) };
        id = row.id as string;
        byKey.set(key(parentId, name), id);
        siblingCount.set(parentId ?? "", position + 1);
        total += 1;
        created += 1;
      }
      parentId = id;
    }
    if (parentId) ids.set(path.join(PATH_SEPARATOR), parentId);
  }
  return { ids, created };
}

function createdMessage(created: number): ActionState {
  if (created === 0) return { ok: "Essas categorias já existiam." };
  return { ok: created === 1 ? "Categoria criada." : `${created} categorias criadas.` };
}

// Uma categoria, opcionalmente já com subcategorias (separadas por vírgula).
export async function createCategory(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const name = categoryName.safeParse(text(formData, "name"));
  if (!name.success) return { error: firstIssue(name.error) };
  const parentText = text(formData, "parent_id");
  const parent = parentText ? uuid.safeParse(parentText) : null;
  if (parent && !parent.success) return { error: firstIssue(parent.error) };

  const subs = [];
  for (const part of text(formData, "subcategories").split(",")) {
    if (!part.trim()) continue;
    const sub = categoryName.safeParse(part.trim());
    if (!sub.success) return { error: firstIssue(sub.error) };
    subs.push(sub.data);
  }
  if (subs.length > 30) return { error: "Adicione no máximo 30 subcategorias por vez." };

  const paths = subs.length > 0 ? subs.map((sub) => [name.data, sub]) : [[name.data]];
  const result = await ensureCategoryPaths(catalog.id, paths, parent?.data ?? null);
  if (result.created > 0) refresh(catalog.slug);
  if (result.error) return { error: result.error };
  return createdMessage(result.created);
}

// Várias de uma vez: uma por linha, com ">" para subcategorias.
export async function createCategoriesBatch(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const lines = String(formData.get("lines") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: "Escreva pelo menos uma categoria." };
  if (lines.length > 60) return { error: "Adicione no máximo 60 linhas por vez." };

  const paths: string[][] = [];
  for (const line of lines) {
    const path = [];
    for (const part of line.split(">")) {
      const parsed = categoryName.safeParse(part.trim());
      if (!parsed.success) return { error: `Linha “${line}”: ${firstIssue(parsed.error)}` };
      path.push(parsed.data);
    }
    if (path.length > 5) return { error: `Linha “${line}”: o máximo são 5 níveis.` };
    paths.push(path);
  }

  const result = await ensureCategoryPaths(catalog.id, paths);
  if (result.created > 0) refresh(catalog.slug);
  if (result.error) return { error: result.error };
  return createdMessage(result.created);
}

// Categorias sugeridas para o segmento, escolhidas na tela de sugestões.
export async function addSuggestedCategories(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const chosen = new Set(formData.getAll("path").map(String));
  const paths = getSegment(catalog.segment).categories.filter((path) =>
    chosen.has(path.join(PATH_SEPARATOR)),
  );
  if (paths.length === 0) return { error: "Marque pelo menos uma categoria." };

  const result = await ensureCategoryPaths(catalog.id, paths);
  if (result.created > 0) refresh(catalog.slug);
  if (result.error) return { error: result.error };
  return createdMessage(result.created);
}

// Item sugerido para o segmento: a lista vem do servidor, o cliente só informa qual e o preço.
export async function addSuggestedItem(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();
  const segment = getSegment(catalog.segment);
  const suggestion = segment.items[Number(text(formData, "index"))];
  if (!suggestion) return { error: "Sugestão inválida." };

  const price = parseBRL(text(formData, "price"));
  if (Number.isNaN(price)) return { error: "Preço inválido. Ex.: 49,90" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("items")
    .select("name")
    .eq("catalog_id", catalog.id);
  const items = existing ?? [];
  if (items.some((item) => item.name.toLowerCase() === suggestion.name.toLowerCase())) {
    return { error: "Esse item já está no seu catálogo." };
  }

  const categories = await ensureCategoryPaths(catalog.id, [suggestion.category]);
  if (categories.error) return { error: categories.error };

  const type = suggestion.type ?? segment.itemType;
  const { error } = await supabase.from("items").insert({
    catalog_id: catalog.id,
    category_id: categories.ids.get(suggestion.category.join(PATH_SEPARATOR)) ?? null,
    type,
    name: suggestion.name,
    price_cents: price,
    price_on_request: price === null,
    duration_minutes: type === "service" ? (suggestion.durationMinutes ?? null) : null,
    position: items.length,
  });
  if (error) return { error: dbMessage(error) };

  refresh(catalog.slug);
  return { ok: `“${suggestion.name}” adicionado.` };
}

// Troca um registro de lugar com o vizinho e renumera as posições do grupo.
async function reorder(
  table: "categories" | "items",
  catalogId: string,
  rows: { id: string }[],
  id: string,
  direction: string,
) {
  const from = rows.findIndex((row) => row.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= rows.length) return;
  const ordered = [...rows];
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

  const supabase = await createClient();
  await Promise.all(
    ordered.map((row, position) =>
      supabase.from(table).update({ position }).eq("id", row.id).eq("catalog_id", catalogId),
    ),
  );
}

export async function moveCategory(formData: FormData) {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("catalog_id", catalog.id)
    .order("position")
    .order("created_at");
  const all = data ?? [];
  const current = all.find((c) => c.id === id.data);
  if (!current) return;
  await reorder(
    "categories",
    catalog.id,
    all.filter((c) => c.parent_id === current.parent_id),
    id.data,
    text(formData, "direction"),
  );
  refresh(catalog.slug);
}

export async function moveItem(formData: FormData) {
  const catalog = await requireCatalog();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select("id, category_id")
    .eq("catalog_id", catalog.id)
    .order("position")
    .order("created_at");
  const all = data ?? [];
  const current = all.find((i) => i.id === id.data);
  if (!current) return;
  await reorder(
    "items",
    catalog.id,
    all.filter((i) => i.category_id === current.category_id),
    id.data,
    text(formData, "direction"),
  );
  refresh(catalog.slug);
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

// "" -> null; número inteiro válido -> número; qualquer outra coisa -> undefined.
function optionalInteger(input: string): number | null | undefined {
  if (!input) return null;
  return /^\d{1,6}$/.test(input) ? Number(input) : undefined;
}

export async function saveItem(formData: FormData): Promise<ActionState> {
  const catalog = await requireCatalog();

  const idText = text(formData, "id");
  const id = idText ? uuid.safeParse(idText) : null;
  if (id && !id.success) return { error: firstIssue(id.error) };
  // Na criação, o id vem pronto do formulário: as fotos já foram enviadas para a pasta dele.
  const newId = id ? null : uuid.safeParse(text(formData, "new_id"));
  if (newId && !newId.success) return { error: firstIssue(newId.error) };

  // Dados internos (só o dono vê)
  const cost = parseBRL(text(formData, "cost"));
  if (Number.isNaN(cost)) return { error: "Custo inválido. Ex.: 12,50" };
  const stockQuantity = optionalInteger(text(formData, "stock_quantity"));
  const stockMin = optionalInteger(text(formData, "stock_min"));
  if (stockQuantity === undefined || stockMin === undefined) {
    return { error: "Estoque inválido. Use apenas números." };
  }
  const abc = z.enum(["A", "B", "C"]).nullable().safeParse(optional(formData, "abc_class"));
  if (!abc.success) return { error: "Curva ABC inválida." };

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
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("catalog_id", catalog.id);
    const { data, error } = await supabase
      .from("items")
      .insert({ ...row, id: newId!.data, catalog_id: catalog.id, position: count ?? 0 })
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

  const { error: privateError } = await supabase.from("item_private").upsert({
    item_id: itemId,
    catalog_id: catalog.id,
    cost_cents: cost,
    stock_quantity: stockQuantity,
    stock_min: stockMin,
    abc_class: abc.data,
  });
  if (privateError) return { error: dbMessage(privateError) };

  // Fotos escolhidas antes de o item existir.
  if (!id) {
    let paths: string[] = [];
    try {
      const parsedPaths = z.array(z.string()).max(20).safeParse(JSON.parse(text(formData, "images") || "[]"));
      if (parsedPaths.success) paths = parsedPaths.data;
    } catch {
      // Lista inválida: cria o item sem fotos.
    }
    const folder = `${catalog.id}/items/${itemId}/`;
    paths = paths.filter((path) => path.startsWith(folder) && isOwnMediaPath(path, catalog.id));
    const plan = await getMyPlan();
    const kept = paths.slice(0, plan.max_images_per_item);
    const extra = paths.slice(plan.max_images_per_item);
    if (kept.length > 0) {
      await supabase.from("item_images").insert(
        kept.map((path, position) => ({ item_id: itemId, catalog_id: catalog.id, path, position })),
      );
    }
    if (extra.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(extra);
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
