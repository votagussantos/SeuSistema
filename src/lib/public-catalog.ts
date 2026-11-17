import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { flattenCategories } from "./categories";
import { mediaUrl, SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import type { CatalogLayout, ItemType } from "./types";

export type PublicVariationGroup = {
  name: string;
  options: { label: string; priceCents: number | null }[];
};

export type PublicItem = {
  id: string;
  type: ItemType;
  name: string;
  description: string | null;
  priceCents: number | null;
  promoPriceCents: number | null;
  priceIsFrom: boolean;
  priceOnRequest: boolean;
  durationMinutes: number | null;
  available: boolean;
  images: string[];
  variations: PublicVariationGroup[];
};

export type PublicCatalog = {
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  layout: CatalogLayout;
  colorPrimary: string;
  colorBackground: string;
  colorText: string;
  whatsapp: string | null;
  instagram: string | null;
  contactEmail: string | null;
  address: string | null;
  city: string | null;
  /** Categorias principais que têm itens, para a navegação. */
  nav: { name: string; sectionId: string }[];
  sections: PublicSection[];
};

export type PublicSection = {
  id: string;
  name: string | null;
  /** Categorias acima desta, da principal ao pai direto. */
  ancestors: string[];
  items: PublicItem[];
};

export const catalogTag = (slug: string) => `catalog:${slug}`;

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const CATALOG_COLUMNS =
  "id, slug, name, description, logo_path, cover_path, layout, color_primary, color_background, color_text, whatsapp, instagram, contact_email, address, city";

type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  cover_path: string | null;
  layout: CatalogLayout;
  color_primary: string;
  color_background: string;
  color_text: string;
  whatsapp: string | null;
  instagram: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
};

// Leitura pública, sem cookies: só enxerga catálogos publicados e não suspensos (RLS).
// Fica em cache até o dono salvar algo no painel (updateTag) ou por um dia.
export async function getPublicCatalog(slug: string): Promise<PublicCatalog | null> {
  "use cache";
  cacheTag(catalogTag(slug));
  cacheLife("days");

  if (!SLUG.test(slug)) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: catalog, error } = await supabase
    .from("catalogs")
    .select(CATALOG_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!catalog) return null;
  return buildCatalog(supabase, catalog);
}

// Pré-visualização do dono: usa a sessão dele, sem cache, e mostra rascunhos.
export async function getCatalogPreview(
  supabase: SupabaseClient,
  catalogId: string,
): Promise<PublicCatalog | null> {
  const { data: catalog, error } = await supabase
    .from("catalogs")
    .select(CATALOG_COLUMNS)
    .eq("id", catalogId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!catalog) return null;
  return buildCatalog(supabase, catalog);
}

async function buildCatalog(
  supabase: SupabaseClient,
  catalog: CatalogRow,
): Promise<PublicCatalog> {
  const byCatalog = { column: "catalog_id", value: catalog.id } as const;
  const [categories, items, images, variations] = await Promise.all([
    supabase
      .from("categories")
      .select("id, parent_id, name")
      .eq(byCatalog.column, byCatalog.value)
      .order("position")
      .order("created_at"),
    supabase
      .from("items")
      .select(
        "id, category_id, type, name, description, price_cents, promo_price_cents, price_is_from, price_on_request, duration_minutes, available",
      )
      .eq(byCatalog.column, byCatalog.value)
      .order("position")
      .order("created_at"),
    supabase
      .from("item_images")
      .select("item_id, path")
      .eq(byCatalog.column, byCatalog.value)
      .order("position")
      .order("created_at"),
    supabase
      .from("item_variations")
      .select("item_id, group_name, label, price_cents, available")
      .eq(byCatalog.column, byCatalog.value)
      .order("position"),
  ]);
  const failed = [categories, items, images, variations].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const imagesByItem = new Map<string, string[]>();
  for (const image of images.data ?? []) {
    const list = imagesByItem.get(image.item_id) ?? [];
    list.push(mediaUrl(image.path));
    imagesByItem.set(image.item_id, list);
  }

  const variationsByItem = new Map<string, PublicVariationGroup[]>();
  for (const v of variations.data ?? []) {
    if (!v.available) continue;
    const groups = variationsByItem.get(v.item_id) ?? [];
    let group = groups.find((g) => g.name === v.group_name);
    if (!group) {
      group = { name: v.group_name, options: [] };
      groups.push(group);
    }
    group.options.push({ label: v.label, priceCents: v.price_cents });
    variationsByItem.set(v.item_id, groups);
  }

  const itemsByCategory = new Map<string | null, PublicItem[]>();
  for (const item of items.data ?? []) {
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push({
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      priceCents: item.price_cents,
      promoPriceCents: item.promo_price_cents,
      priceIsFrom: item.price_is_from,
      priceOnRequest: item.price_on_request,
      durationMinutes: item.duration_minutes,
      available: item.available,
      images: imagesByItem.get(item.id) ?? [],
      variations: variationsByItem.get(item.id) ?? [],
    });
    itemsByCategory.set(item.category_id, list);
  }

  const sections: PublicSection[] = [];
  const nav: PublicCatalog["nav"] = [];
  const seenRoots = new Set<string>();
  const tree = flattenCategories(categories.data ?? []);
  const rootNames = new Map(tree.filter((c) => c.depth === 1).map((c) => [c.id, c.name]));
  for (const category of tree) {
    const list = itemsByCategory.get(category.id);
    if (!list) continue;
    sections.push({
      id: category.id,
      name: category.name,
      ancestors: category.ancestors,
      items: list,
    });
    itemsByCategory.delete(category.id);
    if (!seenRoots.has(category.rootId)) {
      seenRoots.add(category.rootId);
      nav.push({ name: rootNames.get(category.rootId) ?? category.name, sectionId: category.id });
    }
  }
  // Itens sem categoria (ou de categoria que não existe mais) vão para o fim.
  const uncategorized = [...itemsByCategory.values()].flat();
  if (uncategorized.length > 0) {
    const name = sections.length > 0 ? "Outros" : null;
    sections.push({ id: "outros", name, ancestors: [], items: uncategorized });
    if (name) nav.push({ name, sectionId: "outros" });
  }

  return {
    slug: catalog.slug,
    name: catalog.name,
    description: catalog.description,
    logoUrl: catalog.logo_path ? mediaUrl(catalog.logo_path) : null,
    coverUrl: catalog.cover_path ? mediaUrl(catalog.cover_path) : null,
    layout: catalog.layout,
    colorPrimary: catalog.color_primary,
    colorBackground: catalog.color_background,
    colorText: catalog.color_text,
    whatsapp: catalog.whatsapp,
    instagram: catalog.instagram,
    contactEmail: catalog.contact_email,
    address: catalog.address,
    city: catalog.city,
    nav,
    sections,
  };
}
