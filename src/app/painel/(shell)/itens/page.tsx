import { ArrowUpDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { MoveButtons } from "@/components/painel/move-buttons";
import { Button, buttonVariants } from "@/components/ui/button";
import { categoryPath, flattenCategories } from "@/lib/categories";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { getSegment, nounsFor } from "@/lib/segments";
import { mediaUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Category, Item, ItemPrivate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { moveItem } from "../../actions";
import { QuickAvailable, QuickPrice } from "./quick-edit";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "acabando", label: "Acabando", dot: "bg-warning" },
  { id: "sem-foto", label: "Sem foto" },
  { id: "pausados", label: "Pausados" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function isLowStock(internal: ItemPrivate | undefined) {
  return internal?.stock_quantity != null && internal.stock_quantity <= (internal.stock_min ?? 0);
}

// Linha de apoio em mono: estoque, margem, variações ou "sem foto".
function metaFor(item: Item, internal: ItemPrivate | undefined, hasPhoto: boolean) {
  const parts: string[] = [];
  if (!item.available) parts.push("pausado");
  if (isLowStock(internal)) {
    parts.push(internal!.stock_quantity === 0 ? "sem estoque" : `resta ${internal!.stock_quantity}`);
  } else if (internal?.stock_quantity != null) {
    parts.push(`${internal.stock_quantity} un`);
  }
  const price = item.promo_price_cents ?? item.price_cents;
  if (price && internal?.cost_cents != null) {
    parts.push(`${Math.round(((price - internal.cost_cents) / price) * 100)}%`);
  }
  if (item.promo_price_cents != null) parts.push("promoção");
  if (!hasPhoto) parts.push("sem foto");
  return parts.join(" · ");
}

export default async function ItensPage({ searchParams }: PageProps<"/painel/itens">) {
  const params = await searchParams;
  const filter = (FILTERS.some((f) => f.id === params.filtro) ? params.filtro : "") as FilterId;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const ordering = params.ordenar === "1";

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
  const allItems: Item[] = itemRows ?? [];
  const thumbs = new Map<string, string>();
  for (const image of imageRows ?? []) {
    if (!thumbs.has(image.item_id)) thumbs.set(image.item_id, mediaUrl(image.path));
  }

  const counts = {
    acabando: allItems.filter((item) => isLowStock(internal.get(item.id))).length,
    "sem-foto": allItems.filter((item) => !thumbs.has(item.id)).length,
    pausados: allItems.filter((item) => !item.available).length,
  };
  const items = allItems.filter((item) => {
    if (query && !normalize(item.name).includes(normalize(query))) return false;
    if (filter === "acabando") return isLowStock(internal.get(item.id));
    if (filter === "sem-foto") return !thumbs.has(item.id);
    if (filter === "pausados") return !item.available;
    return true;
  });
  // Reordenar só faz sentido vendo a lista inteira.
  const canOrder = ordering && !filter && !query;

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
  const atLimit = allItems.length >= plan.max_items;

  const hrefWith = (next: Record<string, string>) => {
    const search = new URLSearchParams();
    const merged = { filtro: filter, q: query, ...next };
    for (const [key, value] of Object.entries(merged)) if (value) search.set(key, value);
    const text = search.toString();
    return `/painel/itens${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{nouns.Plural}</h1>
          <p className="font-mono text-xs text-muted-foreground">
            {allItems.length} / {plan.max_items} · PLANO {plan.name.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {allItems.length > 1 && (
            <Link
              href={canOrder ? "/painel/itens" : "/painel/itens?ordenar=1"}
              className={buttonVariants({ variant: canOrder ? "default" : "outline", size: "sm" })}
            >
              <ArrowUpDownIcon />
              {canOrder ? "Concluir ordem" : "Ordenar"}
            </Link>
          )}
          {!atLimit && !canOrder && (
            <Link href="/painel/itens/novo" className={buttonVariants({ size: "sm" })}>
              <PlusIcon />
              {nouns.novo}
            </Link>
          )}
        </div>
      </div>

      {allItems.length > 0 && !canOrder && (
        <div className="grid gap-3">
          <form action="/painel/itens" className="flex gap-2">
            {filter && <input type="hidden" name="filtro" value={filter} />}
            <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <SearchIcon className="size-4 shrink-0" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder={`Buscar ${nouns.singular}`}
                aria-label={`Buscar ${nouns.singular}`}
                className="w-full bg-transparent text-base text-foreground outline-none md:text-sm"
              />
            </label>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>
          <nav aria-label="Filtros" className="-mx-4 flex gap-2 overflow-x-auto px-4">
            {FILTERS.map((option) => {
              const active = option.id === filter;
              const count = option.id ? counts[option.id] : allItems.length;
              return (
                <Link
                  key={option.id || "todos"}
                  href={hrefWith({ filtro: option.id })}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-2 rounded-md border px-3 text-[13px]",
                    active ? "border-foreground bg-foreground text-background" : "bg-background",
                  )}
                >
                  {"dot" in option && <span aria-hidden className={`size-2 rounded-full ${option.dot}`} />}
                  {option.label}
                  <span className="font-mono text-xs opacity-70">{count}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {allItems.length === 0 && (
        <div className="rounded-xl border border-dashed bg-background px-6 py-10 text-center">
          <p className="font-medium">{nouns.nenhum} ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre {nouns.primeiro} para aparecer no catálogo.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/painel/itens/novo" className={buttonVariants()}>
              {nouns.novo}
            </Link>
            {getSegment(catalog.segment).items.length > 0 && (
              <Link href="/painel/sugestoes" className={buttonVariants({ variant: "outline" })}>
                Ver sugestões
              </Link>
            )}
          </div>
        </div>
      )}

      {allItems.length > 0 && items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nada encontrado.{" "}
          <Link href="/painel/itens" className="underline underline-offset-4">
            Limpar filtros
          </Link>
        </p>
      )}

      {canOrder && (
        <p className="text-sm text-muted-foreground">
          Use as setas para mudar a ordem dentro de cada categoria. É a mesma ordem do catálogo.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.key} className="grid gap-2">
          {group.title && (
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">{group.title}</h2>
              <span className="font-mono text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <ul className="overflow-hidden rounded-xl border bg-background">
            {group.items.map((item, index) => {
              const meta = metaFor(item, internal.get(item.id), thumbs.has(item.id));
              const warn = isLowStock(internal.get(item.id));
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex min-h-16 items-center gap-3 border-b px-3 py-2 last:border-b-0",
                    !item.available && "text-muted-foreground",
                  )}
                >
                  {thumbs.has(item.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbs.get(item.id)}
                      alt=""
                      loading="lazy"
                      className={cn("size-11 shrink-0 rounded-md border object-cover", !item.available && "opacity-50")}
                    />
                  ) : (
                    <Link
                      href={`/painel/itens/${item.id}`}
                      aria-label={`Adicionar foto em ${item.name}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground"
                    >
                      <PlusIcon className="size-4" />
                    </Link>
                  )}
                  <Link href={`/painel/itens/${item.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                    {meta && (
                      <span className="flex items-center gap-1.5 truncate font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                        {warn && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />}
                        {meta}
                      </span>
                    )}
                  </Link>
                  {canOrder ? (
                    <MoveButtons
                      action={moveItem}
                      id={item.id}
                      index={index}
                      total={group.items.length}
                      name={item.name}
                    />
                  ) : (
                    <>
                      {item.price_on_request ? (
                        <span className="w-28 shrink-0 text-right font-mono text-xs text-muted-foreground uppercase">
                          Sob consulta
                        </span>
                      ) : item.promo_price_cents != null || item.price_is_from ? (
                        // Preço com regra especial: edita no próprio item.
                        <Link
                          href={`/painel/itens/${item.id}`}
                          className="w-28 shrink-0 text-right font-mono text-sm"
                        >
                          {formatBRL(item.promo_price_cents ?? item.price_cents ?? 0)}
                        </Link>
                      ) : (
                        <QuickPrice
                          key={`${item.id}-${item.price_cents}`}
                          id={item.id}
                          name={item.name}
                          cents={item.price_cents}
                        />
                      )}
                      <QuickAvailable
                        key={`${item.id}-${item.available}`}
                        id={item.id}
                        name={item.name}
                        available={item.available}
                      />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {allItems.length > 0 && !canOrder && (
        <p className="text-xs text-muted-foreground">
          Toque no preço para mudar ali mesmo. A chave pausa a venda sem apagar.
        </p>
      )}
    </>
  );
}
