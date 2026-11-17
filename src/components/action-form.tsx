"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/types";

// Formulário que chama uma Server Action sem limpar os campos em caso de erro.
export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  className = "grid gap-4",
  submitClassName,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  submitClassName?: string;
  resetOnSuccess?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
          const state = await action(formData);
          setError(state?.error ?? null);
          if (state?.ok) toast.success(state.ok);
          if (state?.ok && resetOnSuccess) form.reset();
        });
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className={submitClassName}>
          {pending ? "Aguarde…" : submitLabel}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
