import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { sendMagicLink, signInWithGoogle } from "./actions";
import { LoginError } from "./login-error";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
        <span aria-hidden className="size-5 rounded-[5px] bg-foreground" />
        SeuSistema
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Entrar ou criar conta</CardTitle>
          <CardDescription>Sem senha. Se for seu primeiro acesso, a conta é criada na hora.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Suspense>
            <LoginError />
          </Suspense>

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continuar com Google
            </Button>
          </form>

          <div className="eyebrow flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            ou link por e-mail
            <span className="h-px flex-1 bg-border" />
          </div>

          <ActionForm action={sendMagicLink} submitLabel="Receber link de acesso" submitClassName="w-full">
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
      <Toaster position="top-center" />
    </main>
  );
}
