import { durationLabel, ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { AddHint, ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Estilo cardápio: linhas separadas por fios, texto à esquerda e foto à direita.
export function LayoutLista({ slug, items }: LayoutProps) {
  return (
    <ul className="border-t border-(--c-text)/12">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          itemClassName="border-b border-(--c-text)/12"
          className="flex w-full items-stretch gap-3 py-4 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className={`text-[15px] leading-snug font-medium ${item.available ? "" : "opacity-60"}`}>
              {item.name}
            </span>
            {item.description && (
              <span className="line-clamp-2 text-[13px] leading-relaxed opacity-70">{item.description}</span>
            )}
            <span className="mt-auto flex flex-wrap items-center gap-x-2 pt-1 text-sm">
              {item.available ? <ItemPrice item={item} /> : <SoldOut />}
              {item.durationMinutes != null && (
                <span className="font-mono text-[11px] uppercase opacity-60">
                  {durationLabel(item.durationMinutes)}
                </span>
              )}
            </span>
          </span>
          {item.images.length > 0 ? (
            <span className="relative shrink-0">
              <ItemPhoto item={item} className="size-20 rounded-md" />
              {item.available && <AddHint className="absolute -right-1 -bottom-1 size-8" />}
            </span>
          ) : (
            item.available && <AddHint className="self-center" />
          )}
        </ItemTrigger>
      ))}
    </ul>
  );
}
