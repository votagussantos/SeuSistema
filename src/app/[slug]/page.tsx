import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { CartBar } from "@/components/catalogo/cart-bar";
import { LayoutDestaque } from "@/layouts-catalogo/destaque";
import { LayoutGrade } from "@/layouts-catalogo/grade";
import { LayoutLista } from "@/layouts-catalogo/lista";
import { getPublicCatalog } from "@/lib/public-catalog";

const layouts = {
  grade: LayoutGrade,
  lista: LayoutLista,
  destaque: LayoutDestaque,
};

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
      <CatalogView params={params} />
    </Suspense>
  );
}

// Texto preto ou branco, o que tiver mais contraste sobre a cor principal.
function contrastOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000000" : "#ffffff";
}

async function CatalogView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getPublicCatalog(slug);
  if (!catalog) notFound();

  const Layout = layouts[catalog.layout];
  const theme = {
    "--c-primary": catalog.colorPrimary,
    "--c-on-primary": contrastOn(catalog.colorPrimary),
    "--c-bg": catalog.colorBackground,
    "--c-text": catalog.colorText,
  } as CSSProperties;
  const place = [catalog.address, catalog.city].filter(Boolean).join(" · ");
  const contact =
    "rounded-full border border-(--c-text)/25 px-3 py-1.5 text-sm font-medium";

  return (
    <div style={theme} className="flex flex-1 flex-col bg-(--c-bg) text-(--c-text)">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        <header>
          {catalog.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalog.coverUrl}
              alt=""
              fetchPriority="high"
              className="-mx-4 aspect-[3/1] w-[calc(100%+2rem)] max-w-none object-cover sm:mx-0 sm:mt-4 sm:w-full sm:rounded-2xl"
            />
          ) : (
            <div className="h-6" />
          )}
          <div className={`flex items-end gap-4 ${catalog.coverUrl && catalog.logoUrl ? "-mt-10" : "mt-4"}`}>
            {catalog.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={catalog.logoUrl}
                alt=""
                className="size-20 shrink-0 rounded-full border-4 border-(--c-bg) object-cover"
              />
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{catalog.name}</h1>
          {catalog.description && (
            <p className="mt-1 text-sm whitespace-pre-line opacity-80">{catalog.description}</p>
          )}
          {place && <p className="mt-2 text-sm opacity-70">{place}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {catalog.whatsapp && (
              <a
                href={`https://wa.me/${catalog.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={contact}
              >
                WhatsApp
              </a>
            )}
            {catalog.instagram && (
              <a
                href={`https://instagram.com/${catalog.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={contact}
              >
                Instagram
              </a>
            )}
            {catalog.contactEmail && (
              <a href={`mailto:${catalog.contactEmail}`} className={contact}>
                E-mail
              </a>
            )}
          </div>
        </header>

        {catalog.sections.length > 1 && (
          <nav aria-label="Categorias" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
            {catalog.sections.map((section) => (
              <a
                key={section.id}
                href={`#c-${section.id}`}
                className="shrink-0 rounded-full bg-(--c-text)/8 px-3 py-1.5 text-sm font-medium"
              >
                {section.name}
              </a>
            ))}
          </nav>
        )}

        <main className="mt-6 space-y-10">
          {catalog.sections.length === 0 && (
            <p className="text-sm opacity-70">Este catálogo ainda não tem itens.</p>
          )}
          {catalog.sections.map((section) => (
            <section key={section.id} id={`c-${section.id}`} className="scroll-mt-4">
              {section.name && <h2 className="mb-4 text-lg font-semibold">{section.name}</h2>}
              <Layout slug={catalog.slug} items={section.items} />
            </section>
          ))}
        </main>

        <footer className="mt-12 text-center text-xs opacity-60">
          <Link href="/" prefetch={false}>
            Feito com SeuSistema
          </Link>
        </footer>
      </div>

      <CartBar slug={catalog.slug} catalogName={catalog.name} whatsapp={catalog.whatsapp} />
    </div>
  );
}
