import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { ui } from "@/lib/ui";
import { sendMagicLink, signInWithGoogle } from "./actions";
import { LoginError } from "./login-error";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div>
        <Link href="/" className="text-sm font-semibold text-zinc-900">
          SeuSistema
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Entrar ou criar conta</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sem senha: você recebe um link de acesso no e-mail.
        </p>
      </div>

      <Suspense>
        <LoginError />
      </Suspense>

      <ActionForm action={sendMagicLink} submitLabel="Receber link de acesso">
        <div>
          <label htmlFor="email" className={ui.label}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={ui.input}
          />
        </div>
      </ActionForm>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200" />
        ou
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <form action={signInWithGoogle}>
        <button type="submit" className={`${ui.buttonSecondary} w-full`}>
          Entrar com Google
        </button>
      </form>
    </main>
  );
}
