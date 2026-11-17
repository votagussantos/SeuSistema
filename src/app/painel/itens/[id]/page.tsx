import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyPlan, requireCatalog } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Category, Item, ItemImage, ItemVariation } from "@/lib/types";
import { ui } from "@/lib/ui";
import { deleteItem } from "../../actions";
import { ItemForm } from "../item-form";
import { ItemPhotos } from "../item-photos";

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
  const categories: Category[] = categoryRows ?? [];

  const back = (
    <Link href="/painel/itens" className="text-sm text-zinc-600 hover:text-zinc-950">
      ← Itens
    </Link>
  );

  if (id === "novo") {
    return (
      <>
        {back}
        <h1 className={ui.h1}>Novo item</h1>
        <section className={ui.card}>
          <ItemForm item={null} variations={[]} categories={categories} />
        </section>
        <p className="text-sm text-zinc-600">As fotos são adicionadas depois de criar o item.</p>
      </>
    );
  }

  if (!UUID.test(id)) notFound();
  const [plan, { data: item }, { data: variationRows }, { data: imageRows }] = await Promise.all([
    getMyPlan(),
    supabase.from("items").select("*").eq("id", id).eq("catalog_id", catalog.id).maybeSingle(),
    supabase.from("item_variations").select("*").eq("item_id", id).order("position"),
    supabase.from("item_images").select("*").eq("item_id", id).order("position").order("created_at"),
  ]);
  if (!item) notFound();
  const variations: ItemVariation[] = variationRows ?? [];
  const images: ItemImage[] = imageRows ?? [];

  return (
    <>
      {back}
      <h1 className={ui.h1}>{(item as Item).name}</h1>

      <section className={ui.card}>
        <h2 className={ui.h2}>Fotos</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Até {plan.max_images_per_item} fotos. A primeira é a principal.
        </p>
        <div className="mt-4">
          <ItemPhotos
            catalogId={catalog.id}
            itemId={item.id}
            images={images.map((image) => ({ id: image.id, url: mediaUrl(image.path) }))}
            max={plan.max_images_per_item}
          />
        </div>
      </section>

      <section className={ui.card}>
        {/* A key recria o formulário quando os dados salvos mudam. */}
        <ItemForm
          key={item.updated_at}
          item={item}
          variations={variations}
          categories={categories}
        />
      </section>

      <form action={deleteItem}>
        <input type="hidden" name="id" value={item.id} />
        <button type="submit" className={ui.buttonDanger}>
          Excluir item
        </button>
      </form>
    </>
  );
}
