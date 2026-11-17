import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { ItemPhoto, type LayoutProps } from "./shared";

// Fotos grandes: um cartão por linha no celular, dois em telas largas.
export function LayoutDestaque({ slug, items }: LayoutProps) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-(--c-text)/5 text-left transition-transform active:scale-[0.99]"
        >
          <ItemPhoto item={item} className="aspect-[4/3] w-full" />
          <span className="flex flex-1 flex-col gap-2 p-4">
            <span className="text-lg leading-snug font-semibold">{item.name}</span>
            {item.description && (
              <span className="line-clamp-2 text-sm opacity-70">{item.description}</span>
            )}
            <span className="mt-auto flex items-center justify-between gap-3 pt-2">
              <span className="text-base">
                <ItemPrice item={item} />
                {item.durationMinutes != null && (
                  <span className="text-sm opacity-70"> · {durationLabel(item.durationMinutes)}</span>
                )}
              </span>
              {item.available && (
                <span className="shrink-0 rounded-full bg-(--c-primary) px-4 py-2 text-sm font-semibold text-(--c-on-primary)">
                  Ver detalhes
                </span>
              )}
            </span>
          </span>
        </ItemTrigger>
      ))}
    </ul>
  );
}
