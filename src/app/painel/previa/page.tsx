import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalogo/catalog-view";
import { requireCatalog } from "@/lib/data";
import { getCatalogPreview } from "@/lib/public-catalog";
import { createClient } from "@/lib/supabase/server";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

export const metadata: Metadata = { title: "Pré-visualização" };

export default function PreviaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Carregando…</p>}>
      <Preview />
    </Suspense>
  );
}

// Mostra o catálogo como o visitante verá, mesmo em rascunho. Só o dono acessa.
async function Preview() {
  const own = await requireCatalog();
  const catalog = await getCatalogPreview(await createClient(), own.id);
  if (!catalog) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-foreground px-4 py-2 text-sm text-background">
        <Link href="/painel" className="inline-flex items-center gap-1 font-medium">
          <ChevronLeftIcon className="size-4" />
          Voltar ao painel
        </Link>
        <span className="text-right opacity-80">
          Pré-visualização{own.published ? "" : " · rascunho, só você vê"}
        </span>
      </div>
      <CatalogView catalog={catalog} />
    </>
  );
}
