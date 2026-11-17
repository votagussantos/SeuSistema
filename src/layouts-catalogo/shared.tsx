import type { PublicItem } from "@/lib/public-catalog";

export type LayoutProps = { slug: string; items: PublicItem[] };

// Foto principal do item, ou um bloco neutro quando não há foto.
export function ItemPhoto({ item, className }: { item: PublicItem; className: string }) {
  if (item.images.length === 0) {
    return <div aria-hidden className={`${className} bg-(--c-text)/8`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.images[0]}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} object-cover ${item.available ? "" : "opacity-50"}`}
    />
  );
}

export function SoldOut({ item }: { item: PublicItem }) {
  if (item.available) return null;
  return (
    <span className="rounded-full border border-(--c-text)/30 px-2 py-0.5 text-xs font-medium">
      Esgotado
    </span>
  );
}
