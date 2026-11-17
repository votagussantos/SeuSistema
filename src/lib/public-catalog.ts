import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
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
  sections: { id: string; name: string | null; items: PublicItem[] }[];
};

export const catalogTag = (slug: string) => `catalog:${slug}`;

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

// Leitura pública, sem cookies: só enxerga catálogos publicados (RLS).
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
    .select(
      "id, slug, name, description, logo_path, cover_path, layout, color_primary, color_background, color_text, whatsapp, instagram, contact_email, address, city",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!catalog) return null;

  const byCatalog = { column: "catalog_id", value: catalog.id } as const;
  const [categories, items, images, variations] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
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

  const sections: PublicCatalog["sections"] = [];
  for (const category of categories.data ?? []) {
    const list = itemsByCategory.get(category.id);
    if (list) sections.push({ id: category.id, name: category.name, items: list });
  }
  const uncategorized = itemsByCategory.get(null);
  if (uncategorized) {
    sections.push({
      id: "outros",
      name: sections.length > 0 ? "Outros" : null,
      items: uncategorized,
    });
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
    sections,
  };
}
