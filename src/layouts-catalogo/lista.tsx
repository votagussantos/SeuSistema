import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Estilo cardápio: texto à esquerda, miniatura à direita.
export function LayoutLista({ slug, items }: LayoutProps) {
  return (
    <ul className="divide-y divide-(--c-text)/15">
      {items.map((item) => (
        <li key={item.id}>
          <ItemTrigger
            slug={slug}
            item={item}
            className="flex w-full items-start gap-4 py-4 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">{item.name}</span>
              {item.description && (
                <span className="mt-1 line-clamp-2 block text-sm opacity-70">
                  {item.description}
                </span>
              )}
              <span className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <ItemPrice item={item} />
                {item.durationMinutes != null && (
                  <span className="opacity-70">· {durationLabel(item.durationMinutes)}</span>
                )}
                <SoldOut item={item} />
              </span>
            </span>
            {item.images.length > 0 && (
              <ItemPhoto item={item} className="size-20 shrink-0 rounded-lg" />
            )}
          </ItemTrigger>
        </li>
      ))}
    </ul>
  );
}
