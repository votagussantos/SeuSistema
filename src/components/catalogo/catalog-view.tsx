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
    "inline-flex h-10 items-center gap-2 rounded-full border border-(--c-text)/25 px-4 text-sm font-medium";

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
              className="mx-auto aspect-[3/1] w-full max-w-3xl object-cover sm:mt-4 sm:rounded-3xl"
            />
          ) : (
            <div className="h-24 bg-(--c-primary)/15" />
          )}
          <div className="mx-auto w-full max-w-3xl px-4">
            <div className="-mt-12 flex items-end justify-between gap-4">
              {catalog.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={catalog.logoUrl}
                  alt=""
                  className="size-24 shrink-0 rounded-full border-4 border-(--c-bg) bg-(--c-bg) object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-(--c-bg) bg-(--c-primary) text-4xl font-bold text-(--c-on-primary)"
                >
                  {catalog.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{catalog.name}</h1>
            {catalog.description && (
              <p className="mt-2 max-w-prose text-sm whitespace-pre-line opacity-80 sm:text-base">
                {catalog.description}
              </p>
            )}
            {place && (
              <p className="mt-2 flex items-center gap-1.5 text-sm opacity-70">
                <MapPinIcon className="size-4 shrink-0" />
                {place}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {catalog.whatsapp && (
                <a
                  href={`https://wa.me/${catalog.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-(--c-primary) px-4 text-sm font-semibold text-(--c-on-primary)"
                >
                  <MessageCircleIcon className="size-4" />
                  Chamar no WhatsApp
                </a>
              )}
              {catalog.instagram && (
                <a
                  href={`https://instagram.com/${catalog.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={outline}
                >
                  <AtSignIcon className="size-4" />
                  Instagram
                </a>
              )}
              {catalog.contactEmail && (
                <a href={`mailto:${catalog.contactEmail}`} className={outline}>
                  <MailIcon className="size-4" />
                  E-mail
                </a>
              )}
            </div>
          </div>
        </header>

        {allNames.length > 0 && (
          <div className="sticky top-0 z-10 mt-6 border-b border-(--c-text)/10 bg-(--c-bg)/90 backdrop-blur">
            <div className="mx-auto grid w-full max-w-3xl gap-2 px-4 py-2.5">
              <SearchInput />
              {catalog.nav.length > 1 && (
                <nav aria-label="Categorias" className="-mx-4 flex gap-2 overflow-x-auto px-4">
                  {catalog.nav.map((entry) => (
                    <a
                      key={entry.sectionId}
                      href={`#c-${entry.sectionId}`}
                      className="shrink-0 rounded-full border border-(--c-text)/20 px-3 py-1 text-sm font-medium"
                    >
                      {entry.name}
                    </a>
                  ))}
                </nav>
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
                <div className="mb-4">
                  {section.ancestors.length > 0 && (
                    <p className="text-xs font-medium tracking-wide uppercase opacity-60">
                      {section.ancestors.join(" › ")}
                    </p>
                  )}
                  <h2 className="text-xl font-bold tracking-tight">{section.name}</h2>
                </div>
              )}
              <Layout slug={catalog.slug} items={section.items} />
            </SearchSection>
          ))}
        </main>

        <footer className="border-t border-(--c-text)/10">
          <div className="mx-auto grid w-full max-w-3xl gap-1 px-4 py-8 text-center text-sm">
            <p className="font-semibold">{catalog.name}</p>
            {place && <p className="opacity-70">{place}</p>}
            <p className="mt-4 text-xs opacity-60">
              <Link href="/" prefetch={false}>
                Feito com SeuSistema
              </Link>
            </p>
          </div>
        </footer>

        <CartBar slug={catalog.slug} catalogName={catalog.name} whatsapp={catalog.whatsapp} />
      </SearchProvider>
    </div>
  );
}
