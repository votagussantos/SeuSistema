import { EyeIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { PainelNav } from "@/components/painel/nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { getMyCatalog } from "@/lib/data";
import { nounsFor } from "@/lib/segments";

// As abas usam o nome do segmento: "Produtos", "Serviços", "Procedimentos"…
async function SegmentNav() {
  const catalog = await getMyCatalog();
  return <PainelNav itemsLabel={nounsFor(catalog?.segment).Plural} />;
}

function Brand() {
  return (
    <Link href="/painel" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
      <span aria-hidden className="size-7 rounded-md bg-foreground" />
      SeuSistema
    </Link>
  );
}

// Identidade do catálogo no topo: a cor e a inicial do próprio negócio, e o status.
async function CatalogIdentity() {
  const catalog = await getMyCatalog();
  if (!catalog) return <Brand />;
  return (
    <Link href="/painel" className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold text-white"
        style={{ backgroundColor: catalog.color_primary }}
      >
        {catalog.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] leading-tight font-semibold tracking-tight">
          {catalog.name}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${catalog.published ? "bg-success" : "bg-muted-foreground/60"}`}
          />
          {catalog.published ? "Publicado" : "Rascunho"}
        </span>
      </span>
    </Link>
  );
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between gap-3 pt-3">
            <Suspense fallback={<Brand />}>
              <CatalogIdentity />
            </Suspense>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href="/painel/previa"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <EyeIcon />
                <span className="max-sm:sr-only">Pré-visualizar</span>
              </Link>
              <form action="/sair" method="post">
                <Button type="submit" variant="ghost" size="sm" aria-label="Sair">
                  <LogOutIcon />
                  <span className="max-sm:sr-only">Sair</span>
                </Button>
              </form>
            </div>
          </div>
          <Suspense fallback={<PainelNav />}>
            <SegmentNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-4xl flex-1 content-start gap-6 px-4 py-6">
        {/* As páginas leem a sessão, então chegam por streaming atrás deste limite. */}
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
