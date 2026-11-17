import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDelete } from "@/components/painel/confirm-delete";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryPath, flattenCategories } from "@/lib/categories";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSegment, nounsFor } from "@/lib/segments";
import type { Category, Item, ItemImage, ItemPrivate, ItemVariation } from "@/lib/types";
import { deleteItem } from "../../../actions";
import { ItemForm } from "../item-form";
import { ItemPhotos } from "../item-photos";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function ItemPage({ params }: PageProps<"/painel/itens/[id]">) {
  const { id } = await params;
  const catalog = await requireCatalog();
  const supabase = await createClient();
  const { data: categoryRows } = await supabase
    .from("categories")
    .select("*")
    .eq("catalog_id", catalog.id)
    .order("position")
    .order("created_at");
  const categories = flattenCategories<Category>(categoryRows ?? []).map((category) => ({
    id: category.id,
    label: categoryPath(category),
  }));

  const segment = getSegment(catalog.segment);
  const nouns = nounsFor(catalog.segment);
  const back = (
    <Link
      href="/painel/itens"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" />
      {nouns.Plural}
    </Link>
  );

  if (id === "novo") {
    const plan = await getMyPlan();
    return (
      <>
        {back}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{nouns.novo}</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemForm
              item={null}
              internal={null}
              variations={[]}
              categories={categories}
              defaultType={segment.itemType}
              noun={nouns.singular}
              creation={{
                // Id reservado agora para as fotos irem direto para a pasta do item.
                newId: crypto.randomUUID(),
                catalogId: catalog.id,
                maxImages: plan.max_images_per_item,
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  if (!UUID.test(id)) notFound();
  const [plan, { data: itemRow }, { data: variationRows }, { data: imageRows }, { data: privateRow }] =
    await Promise.all([
      getMyPlan(),
      supabase.from("items").select("*").eq("id", id).eq("catalog_id", catalog.id).maybeSingle(),
      supabase.from("item_variations").select("*").eq("item_id", id).order("position"),
      supabase
        .from("item_images")
        .select("*")
        .eq("item_id", id)
        .order("position")
        .order("created_at"),
      supabase.from("item_private").select("*").eq("item_id", id).maybeSingle(),
    ]);
  if (!itemRow) notFound();
  const internal: ItemPrivate | null = privateRow;
  const item: Item & { updated_at: string } = itemRow;
  const variations: ItemVariation[] = variationRows ?? [];
  const images: ItemImage[] = imageRows ?? [];
  const path = categories.find((category) => category.id === item.category_id)?.label;

  return (
    <>
      {back}
      <div>
        {path && <p className="text-sm text-muted-foreground">{path}</p>}
        <h1 className="text-xl font-semibold">{item.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
          <CardDescription>
            Até {plan.max_images_per_item} fotos. A primeira é a principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemPhotos
            catalogId={catalog.id}
            itemId={item.id}
            images={images.map((image) => ({ id: image.id, url: mediaUrl(image.path) }))}
            max={plan.max_images_per_item}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* A key recria o formulário quando os dados salvos mudam. */}
          <ItemForm
            key={item.updated_at}
            item={item}
            internal={internal}
            variations={variations}
            categories={categories}
            defaultType={segment.itemType}
            noun={nouns.singular}
          />
        </CardContent>
      </Card>

      <div>
        <ConfirmDelete
          action={deleteItem}
          id={item.id}
          title={`Excluir “${item.name}”?`}
          description="O item e as fotos dele serão apagados. Não dá para desfazer."
          label="Excluir item"
        />
      </div>
    </>
  );
}
