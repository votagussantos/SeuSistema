import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Fotos grandes em cartões com fio, um por linha no celular e dois em telas largas.
export function LayoutDestaque({ slug, items }: LayoutProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-(--c-text)/15 text-left"
        >
          <ItemPhoto item={item} className="aspect-[16/10] w-full" />
          <span className="flex flex-1 flex-col gap-2 p-4">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-lg leading-snug font-semibold tracking-tight">{item.name}</span>
              <span className="shrink-0 text-[15px]">
                {item.available ? <ItemPrice item={item} /> : <SoldOut />}
              </span>
            </span>
            {item.description && (
              <span className="line-clamp-2 text-sm opacity-70">{item.description}</span>
            )}
            <span className="mt-auto flex items-center justify-between gap-3 border-t border-(--c-text)/12 pt-3">
              <span className="font-mono text-[11px] uppercase opacity-60">
                {item.durationMinutes != null ? durationLabel(item.durationMinutes) : ""}
              </span>
              {item.available && (
                <span className="rounded-md bg-(--c-primary) px-3.5 py-2 text-sm font-medium text-(--c-on-primary)">
                  Escolher
                </span>
              )}
            </span>
          </span>
        </ItemTrigger>
      ))}
    </ul>
  );
}
