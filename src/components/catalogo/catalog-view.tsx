import { AtSignIcon, MailIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LayoutDestaque } from "@/layouts-catalogo/destaque";
import { LayoutGrade } from "@/layouts-catalogo/grade";
import { LayoutLista } from "@/layouts-catalogo/lista";
import type { PublicCatalog } from "@/lib/public-catalog";
import { CartBar } from "./cart-bar";
import { SearchEmpty, SearchInput, SearchProvider, SearchSection } from "./search";

const layouts = {
  grade: LayoutGrade,
  lista: LayoutLista,
  destaque: LayoutDestaque,
};

// Texto preto ou branco, o que tiver mais contraste sobre a cor principal.
function contrastOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000000" : "#ffffff";
}

// Página do catálogo. Usada na rota pública e na pré-visualização do painel.
export function CatalogView({ catalog }: { catalog: PublicCatalog }) {
  const Layout = layouts[catalog.layout];
  const theme = {
    "--c-primary": catalog.colorPrimary,
    "--c-on-primary": contrastOn(catalog.colorPrimary),
    "--c-bg": catalog.colorBackground,
    "--c-text": catalog.colorText,
  } as CSSProperties;
  const place = [catalog.address, catalog.city].filter(Boolean).join(" · ");
  const allNames = catalog.sections.flatMap((section) => section.items.map((item) => item.name));
  const outline =
    "inline-flex h-11 items-center gap-2 rounded-md border border-(--c-text)/15 px-3.5 text-sm";

  return (
    <div style={theme} className="flex flex-1 flex-col bg-(--c-bg) text-(--c-text)">
      <SearchProvider>
        <header>
          {catalog.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={catalog.coverUrl}
              alt=""
              fetchPriority="high"
              className="mx-auto aspect-[3/1] w-full max-w-3xl object-cover sm:mt-4 sm:rounded-xl"
            />
          ) : (
            <div className="h-20 bg-(--c-primary)/20" />
          )}
          <div className="mx-auto w-full max-w-3xl px-4">
            {catalog.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={catalog.logoUrl}
                alt=""
                className="-mt-9 size-18 rounded-xl border-4 border-(--c-bg) bg-(--c-bg) object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="-mt-9 flex size-18 items-center justify-center rounded-xl border-4 border-(--c-bg) bg-(--c-primary) text-3xl font-semibold text-(--c-on-primary)"
              >
                {catalog.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-tight sm:text-4xl">
              {catalog.name}
            </h1>
            {catalog.description && (
              <p className="mt-1.5 max-w-prose text-sm whitespace-pre-line opacity-75 sm:text-base">
                {catalog.description}
              </p>
            )}
            {place && (
              <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase opacity-60">
                <MapPinIcon className="size-3.5 shrink-0" />
                {place}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {catalog.whatsapp && (
                <a
                  href={`https://wa.me/${catalog.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-(--c-primary) px-4 text-sm font-medium text-(--c-on-primary) sm:flex-none"
                >
                  <MessageCircleIcon className="size-4" />
                  Falar no WhatsApp
                </a>
              )}
              {catalog.instagram && (
                <a
                  href={`https://instagram.com/${catalog.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={outline}
                  aria-label="Instagram"
                >
                  <AtSignIcon className="size-4" />
                  <span className="max-sm:sr-only">Instagram</span>
                </a>
              )}
              {catalog.contactEmail && (
                <a href={`mailto:${catalog.contactEmail}`} className={outline} aria-label="E-mail">
                  <MailIcon className="size-4" />
                  <span className="max-sm:sr-only">E-mail</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {allNames.length > 0 && (
          <div className="sticky top-0 z-10 mt-6 border-y border-(--c-text)/12 bg-(--c-bg)/95 backdrop-blur">
            <div className="mx-auto grid w-full max-w-3xl gap-1 px-4 pt-2.5">
              <SearchInput />
              {catalog.nav.length > 1 ? (
                <nav aria-label="Categorias" className="-mx-4 flex gap-5 overflow-x-auto px-4">
                  {catalog.nav.map((entry) => (
                    <a
                      key={entry.sectionId}
                      href={`#c-${entry.sectionId}`}
                      className="shrink-0 border-b-2 border-transparent py-2.5 text-sm opacity-75 hover:border-(--c-text) hover:opacity-100"
                    >
                      {entry.name}
                    </a>
                  ))}
                </nav>
              ) : (
                <div className="h-2.5" />
              )}
            </div>
          </div>
        )}

        <main className="mx-auto grid w-full max-w-3xl flex-1 content-start gap-10 px-4 py-6">
          {allNames.length === 0 ? (
            <p className="py-10 text-center text-sm opacity-70">
              Este catálogo ainda não tem itens.
            </p>
          ) : (
            <SearchEmpty names={allNames} />
          )}
          {catalog.sections.map((section) => (
            <SearchSection
              key={section.id}
              id={`c-${section.id}`}
              names={section.items.map((item) => item.name)}
              className="scroll-mt-32"
            >
              {section.name && (
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    {section.ancestors.length > 0 && (
                      <p className="font-mono text-[11px] tracking-[0.08em] uppercase opacity-60">
                        {section.ancestors.join(" › ")}
                      </p>
                    )}
                    <h2 className="text-xl font-semibold tracking-tight">{section.name}</h2>
                  </div>
                  <span className="font-mono text-xs opacity-50">{section.items.length}</span>
                </div>
              )}
              <Layout slug={catalog.slug} items={section.items} />
            </SearchSection>
          ))}
        </main>

        <footer className="border-t border-(--c-text)/12">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm">
            <span className="font-medium">{catalog.name}</span>
            <Link href="/" prefetch={false} className="font-mono text-[11px] uppercase opacity-50">
              Feito com SeuSistema
            </Link>
          </div>
        </footer>

        <CartBar slug={catalog.slug} catalogName={catalog.name} whatsapp={catalog.whatsapp} />
      </SearchProvider>
    </div>
  );
}
