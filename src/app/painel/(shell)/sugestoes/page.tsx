import Link from "next/link";
import { redirect } from "next/navigation";
import { SuggestedCategories, SuggestedItems } from "@/components/painel/suggestions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryPath, flattenCategories } from "@/lib/categories";
import { requireCatalog } from "@/lib/data";
import { getSegment, nounsFor } from "@/lib/segments";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { addSuggestedCategories, addSuggestedItem } from "../../actions";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

export default async function SugestoesPage() {
  const catalog = await requireCatalog();
  const segment = getSegment(catalog.segment);
  if (segment.categories.length === 0) redirect("/painel");
  const nouns = nounsFor(catalog.segment);

  const supabase = await createClient();
  const [{ data: categoryRows }, { data: itemRows }] = await Promise.all([
    supabase.from("categories").select("*").eq("catalog_id", catalog.id),
    supabase.from("items").select("name").eq("catalog_id", catalog.id),
  ]);
  const existingPaths = new Set(
    flattenCategories<Category>(categoryRows ?? []).map((category) =>
      categoryPath(category).toLowerCase(),
    ),
  );
  const existingItems = new Set((itemRows ?? []).map((item) => item.name.toLowerCase()));

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Sugestões para {segment.name.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Um ponto de partida para você não começar do zero. Adicione só o que fizer sentido;
          dá para editar ou apagar tudo depois.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
          <CardDescription>Organizam o catálogo para o seu cliente achar rápido.</CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestedCategories
            action={addSuggestedCategories}
            categories={segment.categories.map((path) => ({
              path: path.join(" > "),
              exists: existingPaths.has(path.join(" › ").toLowerCase()),
            }))}
          />
        </CardContent>
      </Card>

      {segment.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{nouns.plural} mais comuns</CardTitle>
            <CardDescription>
              Informe o preço e toque em Adicionar. Sem preço, entra como “sob consulta”. A
              categoria é criada junto, se ainda não existir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuggestedItems
              action={addSuggestedItem}
              items={segment.items.map((item, index) => ({
                index,
                name: item.name,
                category: item.category.join(" › "),
                exists: existingItems.has(item.name.toLowerCase()),
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/painel/itens" className={buttonVariants()}>
          Ver meus {nouns.plural}
        </Link>
        <Link href="/painel" className={buttonVariants({ variant: "outline" })}>
          Ir para o início
        </Link>
      </div>
    </>
  );
}
