import { PlusIcon } from "lucide-react";
import type { PublicItem } from "@/lib/public-catalog";

export type LayoutProps = { slug: string; items: PublicItem[] };

function discount(item: PublicItem) {
  if (item.priceOnRequest || !item.priceCents || item.promoPriceCents == null) return null;
  const percent = Math.round((1 - item.promoPriceCents / item.priceCents) * 100);
  return percent > 0 ? percent : null;
}

// Foto principal com os selos por cima (promoção, esgotado).
export function ItemPhoto({
  item,
  className,
  badges = true,
}: {
  item: PublicItem;
  className: string;
  badges?: boolean;
}) {
  const percent = discount(item);
  return (
    <span className={`relative block overflow-hidden bg-(--c-text)/8 ${className}`}>
      {item.images.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.images[0]}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-full object-cover ${item.available ? "" : "opacity-40 grayscale"}`}
        />
      )}
      {badges && !item.available && (
        <span className="absolute inset-x-0 bottom-0 bg-(--c-text) py-1 text-center text-xs font-semibold text-(--c-bg)">
          Esgotado
        </span>
      )}
      {badges && item.available && percent && (
        <span className="absolute top-2 left-2 rounded-full bg-(--c-primary) px-2 py-0.5 text-xs font-semibold text-(--c-on-primary)">
          −{percent}%
        </span>
      )}
    </span>
  );
}

// Indica visualmente que o cartão abre os detalhes para adicionar.
export function AddHint({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-(--c-primary) text-(--c-on-primary) shadow-sm ${className}`}
    >
      <PlusIcon className="size-5" />
    </span>
  );
}
