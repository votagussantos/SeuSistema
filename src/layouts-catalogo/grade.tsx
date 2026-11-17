import { ItemPrice } from "@/components/catalogo/item-price";
import { ItemTrigger } from "@/components/catalogo/item-trigger";
import { ItemPhoto, SoldOut, type LayoutProps } from "./shared";

// Vitrine em colunas: foto quadrada, nome e preço.
export function LayoutGrade({ slug, items }: LayoutProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <ItemTrigger slug={slug} item={item} className="block w-full text-left">
            <ItemPhoto item={item} className="aspect-square w-full rounded-xl" />
            <span className="mt-2 block text-sm leading-snug font-medium">{item.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <ItemPrice item={item} />
              <SoldOut item={item} />
            </span>
          </ItemTrigger>
        </li>
      ))}
    </ul>
  );
}
