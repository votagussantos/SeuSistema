import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-semibold tracking-tight">SeuSistema · Administração</span>
          <Link href="/painel" className="text-sm text-muted-foreground hover:text-foreground">
            Meu painel
          </Link>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-6 px-4 py-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
          {children}
        </Suspense>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
