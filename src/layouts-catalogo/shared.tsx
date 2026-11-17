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
    <span className={`relative block overflow-hidden bg-(--c-text)/[0.06] ${className}`}>
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
      {badges && item.available && percent && (
        <span className="absolute top-2 left-2 rounded-sm bg-(--c-primary) px-1.5 py-0.5 font-mono text-[11px] text-(--c-on-primary)">
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
      className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-(--c-primary) text-(--c-on-primary) ${className}`}
    >
      <PlusIcon className="size-4" />
    </span>
  );
}

export function SoldOut() {
  return <span className="font-mono text-[11px] uppercase opacity-60">Esgotado</span>;
}
