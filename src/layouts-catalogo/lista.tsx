import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { AddHint, ItemPhoto, type LayoutProps } from "./shared";

// Estilo cardápio: texto à esquerda, foto à direita.
export function LayoutLista({ slug, items }: LayoutProps) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          className="flex w-full items-stretch gap-3 rounded-2xl bg-(--c-text)/5 p-3 text-left transition-transform active:scale-[0.99]"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-base leading-snug font-semibold">{item.name}</span>
            {item.description && (
              <span className="line-clamp-2 text-sm opacity-70">{item.description}</span>
            )}
            <span className="mt-auto flex flex-wrap items-center gap-x-2 pt-1 text-sm">
              <ItemPrice item={item} />
              {item.durationMinutes != null && (
                <span className="opacity-70">· {durationLabel(item.durationMinutes)}</span>
              )}
              {!item.available && item.images.length === 0 && (
                <span className="rounded-full border border-(--c-text)/30 px-2 text-xs">
                  Esgotado
                </span>
              )}
            </span>
          </span>
          {item.images.length > 0 ? (
            <ItemPhoto item={item} className="size-24 shrink-0 rounded-xl" />
          ) : (
            item.available && <AddHint className="self-center" />
          )}
        </ItemTrigger>
      ))}
    </ul>
  );
}
