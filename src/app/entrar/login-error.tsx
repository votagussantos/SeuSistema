"use client";

import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  link: "O link expirou ou já foi usado. Peça um novo.",
  google: "Não foi possível entrar com o Google. Tente o link por e-mail.",
};

export function LoginError() {
  const code = useSearchParams().get("erro");
  if (!code) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {messages[code] ?? "Não foi possível entrar. Tente novamente."}
    </p>
  );
}
