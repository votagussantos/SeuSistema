import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Category, Item } from "@/lib/types";
import { ui } from "@/lib/ui";
import { createCategory, deleteCategory, renameCategory } from "../actions";

function priceLabel(item: Item) {
  if (item.price_on_request || item.price_cents == null) return "Sob consulta";
  const price = formatBRL(item.promo_price_cents ?? item.price_cents);
  return item.price_is_from ? `A partir de ${price}` : price;
}

export default async function ItensPage() {
  const catalog = await requireCatalog();
  const supabase = await createClient();
  const [plan, { data: categoryRows }, { data: itemRows }] = await Promise.all([
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
  ]);
  const categories: Category[] = categoryRows ?? [];
  const items: Item[] = itemRows ?? [];
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const atLimit = items.length >= plan.max_items;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={ui.h1}>Itens</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {items.length} de {plan.max_items} itens do plano {plan.name}
          </p>
        </div>
        {atLimit ? (
          <p className="text-sm text-zinc-600">Limite do plano atingido.</p>
        ) : (
          <Link href="/painel/itens/novo" className={ui.button}>
            Novo item
          </Link>
        )}
      </div>

      <section className={ui.card}>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Nenhum item ainda. Cadastre seu primeiro produto ou serviço.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/painel/itens/${item.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900">
                      {item.name}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {item.type === "product" ? "Produto" : "Serviço"}
                      {item.category_id && ` · ${categoryNames.get(item.category_id) ?? ""}`}
                      {!item.available && " · Esgotado"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-zinc-700">{priceLabel(item)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.card}>
        <h2 className={ui.h2}>Categorias</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Organizam os itens no catálogo. Ao excluir uma categoria, os itens dela ficam sem categoria.
        </p>
        <ul className="mt-4 space-y-3">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-start gap-2">
              <ActionForm
                action={renameCategory}
                submitLabel="Renomear"
                className="flex flex-1 flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={category.id} />
                <input
                  name="name"
                  aria-label="Nome da categoria"
                  required
                  maxLength={60}
                  defaultValue={category.name}
                  className={`${ui.input} mt-0 min-w-40 flex-1`}
                />
              </ActionForm>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button type="submit" className={ui.buttonDanger}>
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <ActionForm
            key={categories.length}
            action={createCategory}
            submitLabel="Adicionar"
            className="flex flex-wrap items-center gap-2"
          >
            <input
              name="name"
              aria-label="Nova categoria"
              placeholder="Nova categoria"
              required
              maxLength={60}
              className={`${ui.input} mt-0 min-w-40 flex-1`}
            />
          </ActionForm>
        </div>
      </section>
    </>
  );
}
