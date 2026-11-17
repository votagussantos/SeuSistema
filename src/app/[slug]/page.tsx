import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalogo/catalog-view";
import { getPublicCatalog } from "@/lib/public-catalog";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalog(slug);
  if (!catalog) return { title: "Catálogo não encontrado", robots: { index: false } };
  const description = catalog.description ?? `Catálogo de ${catalog.name}.`;
  return {
    title: { absolute: catalog.name },
    description,
    openGraph: {
      title: catalog.name,
      description,
      images: catalog.coverUrl ?? catalog.logoUrl ?? undefined,
    },
  };
}

export default function CatalogPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense>
      <PublicCatalogPage params={params} />
    </Suspense>
  );
}

async function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getPublicCatalog(slug);
  if (!catalog) notFound();
  return <CatalogView catalog={catalog} />;
}
