import { ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { AddHint, ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Vitrine em colunas: foto quadrada, nome e preço, sem moldura de cartão.
export function LayoutGrade({ slug, items }: LayoutProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
      {items.map((item) => (
        <ItemTrigger
          key={item.id}
          slug={slug}
          item={item}
          className="flex h-full w-full flex-col gap-2 text-left"
        >
          <span className="relative block">
            <ItemPhoto item={item} className="aspect-square w-full rounded-lg" />
            {item.available && <AddHint className="absolute right-2 bottom-2" />}
          </span>
          <span className={`line-clamp-2 text-sm leading-snug font-medium ${item.available ? "" : "opacity-60"}`}>
            {item.name}
          </span>
          <span className="-mt-1 text-sm">{item.available ? <ItemPrice item={item} /> : <SoldOut />}</span>
        </ItemTrigger>
      ))}
    </ul>
  );
}
