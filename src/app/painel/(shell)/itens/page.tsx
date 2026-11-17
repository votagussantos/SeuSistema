import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { MoveButtons } from "@/components/painel/move-buttons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryPath, flattenCategories } from "@/lib/categories";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { getSegment, nounsFor } from "@/lib/segments";
import { mediaUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Category, Item, ItemPrivate } from "@/lib/types";
import { moveItem } from "../../actions";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

function priceLabel(item: Item) {
  if (item.price_on_request || item.price_cents == null) return "Sob consulta";
  const price = formatBRL(item.promo_price_cents ?? item.price_cents);
  return item.price_is_from ? `A partir de ${price}` : price;
}

function marginLabel(item: Item, internal: ItemPrivate | undefined) {
  const price = item.promo_price_cents ?? item.price_cents;
  if (!price || internal?.cost_cents == null) return null;
  return `${Math.round(((price - internal.cost_cents) / price) * 100)}%`;
}

function isLowStock(internal: ItemPrivate | undefined) {
  return (
    internal?.stock_quantity != null && internal.stock_quantity <= (internal.stock_min ?? 0)
  );
}

export default async function ItensPage() {
  const catalog = await requireCatalog();
  const supabase = await createClient();
  const nouns = nounsFor(catalog.segment);
  const [plan, { data: categoryRows }, { data: itemRows }, { data: imageRows }, { data: privateRows }] =
    await Promise.all([
      getMyPlan(),
      supabase
        .from("categories")
        .select("*")
        .eq("catalog_id", catalog.id)
        .order("position")
        .order("created_at"),
      supabase
        .from("items")
        .select("*")
        .eq("catalog_id", catalog.id)
        .order("position")
        .order("created_at"),
      supabase
        .from("item_images")
        .select("item_id, path")
        .eq("catalog_id", catalog.id)
        .order("position")
        .order("created_at"),
      supabase.from("item_private").select("*").eq("catalog_id", catalog.id),
    ]);
  const internal = new Map<string, ItemPrivate>(
    (privateRows ?? []).map((row: ItemPrivate) => [row.item_id, row]),
  );
  const categories = flattenCategories<Category>(categoryRows ?? []);
  const items: Item[] = itemRows ?? [];
  const thumbs = new Map<string, string>();
  for (const image of imageRows ?? []) {
    if (!thumbs.has(image.item_id)) thumbs.set(image.item_id, mediaUrl(image.path));
  }

  // Mesma ordem do catálogo público: categorias na ordem da árvore, sem categoria no fim.
  const groups = [
    ...categories.map((category) => ({
      key: category.id,
      title: categoryPath(category),
      items: items.filter((item) => item.category_id === category.id),
    })),
    {
      key: "none",
      title: categories.length > 0 ? "Sem categoria" : "",
      items: items.filter(
        (item) => !item.category_id || !categories.some((c) => c.id === item.category_id),
      ),
    },
  ].filter((group) => group.items.length > 0);
  const atLimit = items.length >= plan.max_items;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{nouns.Plural}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} de {plan.max_items} no plano {plan.name}
          </p>
        </div>
        {atLimit ? (
          <Badge variant="secondary">Limite do plano atingido</Badge>
        ) : (
          <Link href="/painel/itens/novo" className={buttonVariants()}>
            <PlusIcon />
            {nouns.novo}
          </Link>
        )}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">{nouns.nenhum} ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre {nouns.primeiro} para aparecer no catálogo.
            </p>
            {getSegment(catalog.segment).items.length > 0 && (
              <Link
                href="/painel/sugestoes"
                className={`${buttonVariants({ variant: "outline" })} mt-4`}
              >
                Ver sugestões para o seu segmento
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group.key}>
          {group.title && (
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{group.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <ul className="divide-y">
              {group.items.map((item, index) => (
                <li key={item.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/painel/itens/${item.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:bg-muted/60"
                  >
                    {thumbs.has(item.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbs.get(item.id)}
                        alt=""
                        loading="lazy"
                        className="size-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span aria-hidden className="size-12 shrink-0 rounded-lg bg-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {priceLabel(item)}
                        {marginLabel(item, internal.get(item.id)) && (
                          <span>· margem {marginLabel(item, internal.get(item.id))}</span>
                        )}
                        {internal.get(item.id)?.abc_class && (
                          <Badge variant="secondary">{internal.get(item.id)?.abc_class}</Badge>
                        )}
                        {!item.available && <Badge variant="outline">Esgotado</Badge>}
                        {isLowStock(internal.get(item.id)) && (
                          <Badge variant="destructive">Estoque baixo</Badge>
                        )}
                      </span>
                    </span>
                  </Link>
                  <MoveButtons
                    action={moveItem}
                    id={item.id}
                    index={index}
                    total={group.items.length}
                    name={item.name}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
