import { PlusIcon } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ConfirmDelete } from "@/components/painel/confirm-delete";
import { MoveButtons } from "@/components/painel/move-buttons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categoryPath, flattenCategories, MAX_CATEGORY_DEPTH } from "@/lib/categories";
import { requireCatalog } from "@/lib/data";
import { getSegment } from "@/lib/segments";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import {
  addSuggestedCategories,
  createCategoriesBatch,
  createCategory,
  deleteCategory,
  moveCategory,
  renameCategory,
} from "../../actions";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

export default async function CategoriasPage() {
  const catalog = await requireCatalog();
  const supabase = await createClient();
  const [{ data }, { data: itemRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("catalog_id", catalog.id)
      .order("position")
      .order("created_at"),
    supabase.from("items").select("category_id").eq("catalog_id", catalog.id),
  ]);
  const categories = flattenCategories<Category>(data ?? []);
  const counts = new Map<string, number>();
  for (const row of itemRows ?? []) {
    if (row.category_id) counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  const uncategorized = (itemRows ?? []).filter(
    (row) => !row.category_id || !categories.some((c) => c.id === row.category_id),
  ).length;

  // Sugestões do segmento que ainda não existem.
  const existing = new Set(categories.map((c) => categoryPath(c).toLowerCase()));
  const suggestions = getSegment(catalog.segment).categories.filter(
    (path) => !existing.has(path.join(" › ").toLowerCase()),
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizam o catálogo. Cada uma pode ter subcategorias, até {MAX_CATEGORY_DEPTH} níveis.
        </p>
      </div>

      <section className="grid gap-2">
        <h2 className="eyebrow">Adicionar</h2>
        <ActionForm
          action={createCategoriesBatch}
          submitLabel="Criar"
          resetOnSuccess
          className="grid gap-2"
        >
          <Textarea
            name="lines"
            aria-label="Novas categorias"
            rows={1}
            required
            placeholder="Bebidas > Sucos"
            className="min-h-10 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use <span className="font-mono text-foreground">&gt;</span> para subcategoria. Para
            criar várias, uma por linha. O que já existir é aproveitado.
          </p>
        </ActionForm>
      </section>

      {categories.length > 0 && (
        <section className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Estrutura</h2>
            <span className="font-mono text-xs text-muted-foreground">{categories.length}</span>
          </div>
          <ul className="overflow-hidden rounded-xl border bg-background">
            {categories.map((category) => (
              <li key={category.id} className="border-b last:border-b-0">
                <div
                  className="flex items-start gap-1 py-2 pr-2"
                  style={{ paddingLeft: `${0.75 + (category.depth - 1) * 1.25}rem` }}
                >
                  {category.depth > 1 && (
                    <span aria-hidden className="pt-2.5 pr-1 font-mono text-sm text-muted-foreground/50">
                      {category.index === category.siblings - 1 ? "└─" : "├─"}
                    </span>
                  )}
                  <ActionForm
                    action={renameCategory}
                    submitLabel="Salvar"
                    className="flex min-w-0 flex-1 items-start gap-2"
                    submitClassName="max-sm:hidden"
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <Input
                      name="name"
                      aria-label={`Nome de ${categoryPath(category)}`}
                      required
                      maxLength={60}
                      defaultValue={category.name}
                      className={`min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring ${category.depth === 1 ? "font-medium" : ""}`}
                    />
                  </ActionForm>
                  <span className="pt-2.5 font-mono text-xs text-muted-foreground">
                    {counts.get(category.id) ?? 0}
                  </span>
                  <MoveButtons
                    action={moveCategory}
                    id={category.id}
                    index={category.index}
                    total={category.siblings}
                    name={category.name}
                  />
                  <ConfirmDelete
                    action={deleteCategory}
                    id={category.id}
                    title={`Excluir “${category.name}”?`}
                    description="As subcategorias também serão excluídas. Os itens não são apagados: ficam sem categoria."
                  />
                </div>
                {category.depth < MAX_CATEGORY_DEPTH && (
                  <details
                    className="group"
                    style={{ paddingLeft: `${0.75 + category.depth * 1.25}rem` }}
                  >
                    <summary className="flex h-9 w-fit cursor-pointer list-none items-center gap-1.5 pr-3 text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                      <PlusIcon className="size-3.5" />
                      Subcategoria em {category.name}
                    </summary>
                    <ActionForm
                      action={createCategory}
                      submitLabel="Adicionar"
                      resetOnSuccess
                      className="flex flex-wrap items-start gap-2 pr-3 pb-3"
                    >
                      <input type="hidden" name="parent_id" value={category.id} />
                      <Input
                        name="name"
                        aria-label={`Nova subcategoria de ${category.name}`}
                        placeholder="Nome"
                        required
                        maxLength={60}
                        className="min-w-32 flex-1"
                      />
                      <Input
                        name="subcategories"
                        aria-label="Subcategorias desta, separadas por vírgula (opcional)"
                        placeholder="Dentro dela (opcional): A, B"
                        className="min-w-32 flex-1"
                      />
                    </ActionForm>
                  </details>
                )}
              </li>
            ))}
            {uncategorized > 0 && (
              <li className="flex min-h-12 items-center justify-between px-4 text-sm text-muted-foreground">
                Sem categoria
                <span className="font-mono text-xs">{uncategorized}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="grid gap-2">
          <h2 className="eyebrow">Sugerido para o seu segmento</h2>
          <ActionForm
            action={addSuggestedCategories}
            submitLabel="Adicionar selecionadas"
            className="grid gap-3 rounded-xl border border-dashed bg-background p-4"
          >
            <ul className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((path) => (
                <li key={path.join(">")}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="path"
                      value={path.join(" > ")}
                      defaultChecked
                      className="size-4 accent-foreground"
                    />
                    {path.join(" › ")}
                  </label>
                </li>
              ))}
            </ul>
          </ActionForm>
        </section>
      )}
    </>
  );
}
