"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { ui } from "@/lib/ui";

// Formulário que chama uma Server Action sem limpar os campos em caso de erro.
export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  className = "space-y-4",
}: {
  action: (formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          setState(await action(formData));
        });
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={ui.button}>
          {pending ? "Aguarde…" : submitLabel}
        </button>
        {state?.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="text-sm text-emerald-700">
            {state.ok}
          </p>
        )}
      </div>
    </form>
  );
}
