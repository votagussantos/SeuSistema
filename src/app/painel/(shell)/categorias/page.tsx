import { ActionForm } from "@/components/action-form";
import { ConfirmDelete } from "@/components/painel/confirm-delete";
import { Field } from "@/components/painel/field";
import { MoveButtons } from "@/components/painel/move-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categoryPath, flattenCategories, MAX_CATEGORY_DEPTH } from "@/lib/categories";
import { requireCatalog } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import {
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
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("catalog_id", catalog.id)
    .order("position")
    .order("created_at");
  const categories = flattenCategories<Category>(data ?? []);

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizam os itens no catálogo. Cada categoria pode ter subcategorias, até{" "}
          {MAX_CATEGORY_DEPTH} níveis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
          <CardDescription>
            Se quiser, já informe as subcategorias, separadas por vírgula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={createCategory} submitLabel="Adicionar" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" htmlFor="new-name">
                <Input id="new-name" name="name" placeholder="Ex.: Bebidas" required maxLength={60} />
              </Field>
              <Field label="Subcategorias (opcional)" htmlFor="new-subs">
                <Input
                  id="new-subs"
                  name="subcategories"
                  placeholder="Ex.: Sucos, Refrigerantes, Águas"
                />
              </Field>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar várias de uma vez</CardTitle>
          <CardDescription>
            Uma por linha. Use “&gt;” para subcategorias. O que já existir é aproveitado, não
            duplicado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={createCategoriesBatch} submitLabel="Adicionar todas" resetOnSuccess>
            <Textarea
              name="lines"
              aria-label="Categorias, uma por linha"
              rows={6}
              required
              placeholder={"Pratos\nBebidas > Sucos\nBebidas > Refrigerantes\nSobremesas"}
              className="font-mono"
            />
          </ActionForm>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suas categorias</CardTitle>
            <CardDescription>
              Use as setas para mudar a ordem. Excluir uma categoria exclui também as
              subcategorias; os itens ficam sem categoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {categories.map((category) => (
                <li
                  key={category.id}
                  // Recuo por nível, com uma linha-guia à esquerda.
                  style={{ marginLeft: `${(category.depth - 1) * 0.875}rem` }}
                  className={category.depth > 1 ? "border-l-2 pl-3" : undefined}
                >
                  {category.depth > 1 && (
                    <p className="mb-1 text-xs text-muted-foreground">
                      {category.ancestors.join(" › ")} ›
                    </p>
                  )}
                  <div className="flex items-start gap-1">
                    <ActionForm
                      action={renameCategory}
                      submitLabel="Salvar"
                      className="flex min-w-0 flex-1 flex-wrap items-start gap-2"
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <Input
                        name="name"
                        aria-label={`Nome de ${categoryPath(category)}`}
                        required
                        maxLength={60}
                        defaultValue={category.name}
                        className="min-w-32 flex-1"
                      />
                    </ActionForm>
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
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline">
                        Adicionar subcategoria
                      </summary>
                      <ActionForm
                        action={createCategory}
                        submitLabel="Adicionar"
                        resetOnSuccess
                        className="mt-2 flex flex-wrap items-start gap-2"
                      >
                        <input type="hidden" name="parent_id" value={category.id} />
                        <Input
                          name="name"
                          aria-label={`Nova subcategoria de ${category.name}`}
                          placeholder={`Subcategoria de ${category.name}`}
                          required
                          maxLength={60}
                          className="min-w-32 flex-1"
                        />
                      </ActionForm>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
