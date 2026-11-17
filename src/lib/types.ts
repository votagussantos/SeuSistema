export type CatalogLayout = "grade" | "lista" | "destaque";
export type ItemType = "product" | "service";

export type Catalog = {
  id: string;
  owner_id: string;
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
  published: boolean;
};

export type Category = {
  id: string;
  catalog_id: string;
  name: string;
  position: number;
};

export type Item = {
  id: string;
  catalog_id: string;
  category_id: string | null;
  type: ItemType;
  name: string;
  description: string | null;
  price_cents: number | null;
  promo_price_cents: number | null;
  price_is_from: boolean;
  price_on_request: boolean;
  duration_minutes: number | null;
  available: boolean;
  position: number;
};

export type ItemImage = {
  id: string;
  item_id: string;
  path: string;
  position: number;
};

export type ItemVariation = {
  id: string;
  item_id: string;
  group_name: string;
  label: string;
  price_cents: number | null;
  available: boolean;
  position: number;
};

export type Plan = {
  id: string;
  name: string;
  max_catalogs: number;
  max_items: number;
  max_images_per_item: number;
  show_badge: boolean;
};

export type ActionState = { error?: string; ok?: string } | null;
