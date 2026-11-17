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

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between gap-3 pt-3">
            <Link href="/painel" className="text-base font-semibold tracking-tight">
              SeuSistema
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/painel/previa"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <EyeIcon />
                Pré-visualizar
              </Link>
              <form action="/sair" method="post">
                <Button type="submit" variant="ghost" size="sm">
                  <LogOutIcon />
                  Sair
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
