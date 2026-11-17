import Link from "next/link";
import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-semibold text-zinc-900">SeuSistema</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        O catálogo online do seu negócio, grátis.
      </h1>
      <p className="text-base text-zinc-600">
        Cadastre seus produtos e serviços, escolha as cores e o layout, e receba
        os pedidos direto no seu WhatsApp.
      </p>
      <div>
        <Link href="/entrar" className={ui.button}>
          Criar meu catálogo
        </Link>
      </div>
    </main>
  );
}
