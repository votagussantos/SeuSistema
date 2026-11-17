import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false },
};

const links = [
  { href: "/painel", label: "Catálogo" },
  { href: "/painel/aparencia", label: "Aparência" },
  { href: "/painel/itens", label: "Itens" },
];

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-sm font-semibold text-zinc-900">SeuSistema</span>
          <nav className="flex flex-1 gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-zinc-700 hover:text-zinc-950">
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/sair" method="post">
            <button type="submit" className="text-sm text-zinc-600 hover:text-zinc-950">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        {/* As páginas leem a sessão, então chegam por streaming atrás deste limite. */}
        <Suspense fallback={<p className="text-sm text-zinc-500">Carregando…</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
