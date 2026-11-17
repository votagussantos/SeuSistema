import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Fotos grandes, um item por linha.
export function LayoutDestaque({ slug, items }: LayoutProps) {
  return (
    <ul className="space-y-8">
      {items.map((item) => (
        <li key={item.id}>
          <ItemTrigger slug={slug} item={item} className="block w-full text-left">
            <ItemPhoto item={item} className="aspect-[4/3] w-full rounded-2xl" />
            <span className="mt-3 flex items-start justify-between gap-4">
              <span className="text-lg leading-snug font-semibold">{item.name}</span>
              <span className="shrink-0 text-base">
                <ItemPrice item={item} />
              </span>
            </span>
            {item.description && (
              <span className="mt-1 line-clamp-3 block text-sm opacity-70">
                {item.description}
              </span>
            )}
            <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {item.durationMinutes != null && (
                <span className="opacity-70">{durationLabel(item.durationMinutes)}</span>
              )}
              <SoldOut item={item} />
            </span>
          </ItemTrigger>
        </li>
      ))}
    </ul>
  );
}
