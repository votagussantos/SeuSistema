import { ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { AddHint, ItemPhoto, type LayoutProps } from "./shared";

// Vitrine em colunas: cartões com foto quadrada, nome e preço.
export function LayoutGrade({ slug, items }: LayoutProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-(--c-text)/5 text-left transition-transform active:scale-[0.98]"
        >
          <span className="relative block">
            <ItemPhoto item={item} className="aspect-square w-full" />
            {item.available && <AddHint className="absolute right-2 bottom-2" />}
          </span>
          <span className="flex flex-1 flex-col gap-1 p-3">
            <span className="line-clamp-2 text-sm leading-snug font-medium">{item.name}</span>
            <span className="mt-auto text-sm">
              <ItemPrice item={item} />
            </span>
          </span>
        </ItemTrigger>
      ))}
    </ul>
  );
}
