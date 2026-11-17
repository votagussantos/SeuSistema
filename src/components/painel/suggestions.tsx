"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ActionForm } from "@/components/action-form";
import { MoneyInput } from "@/components/masked-inputs";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/types";

type Action = (formData: FormData) => Promise<ActionState>;

export function SuggestedCategories({
  action,
  categories,
}: {
  action: Action;
  categories: { path: string; exists: boolean }[];
}) {
  const pending = categories.filter((category) => !category.exists);
  if (pending.length === 0) {
    return <p className="text-sm text-muted-foreground">Você já adicionou todas as categorias sugeridas.</p>;
  }
  return (
    <ActionForm action={action} submitLabel="Adicionar selecionadas" className="grid gap-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {categories.map((category) => (
          <li key={category.path}>
            <label className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
              {category.exists ? (
                <CheckIcon className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <input
                  type="checkbox"
                  name="path"
                  value={category.path}
                  defaultChecked
                  className="size-4 accent-foreground"
                />
              )}
              <span className={category.exists ? "text-muted-foreground" : undefined}>
                {category.path.replaceAll(" > ", " › ")}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </ActionForm>
  );
}

export function SuggestedItems({
  action,
  items,
}: {
  action: Action;
  items: { index: number; name: string; category: string; exists: boolean }[];
}) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <SuggestedItemRow key={item.index} action={action} item={item} />
      ))}
    </ul>
  );
}

function SuggestedItemRow({
  action,
  item,
}: {
  action: Action;
  item: { index: number; name: string; category: string; exists: boolean };
}) {
  const [price, setPrice] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.category}</p>
      </div>
      {item.exists ? (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <CheckIcon className="size-4 text-emerald-600" />
          Adicionado
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-32">
            <MoneyInput
              aria-label={`Preço de ${item.name}`}
              placeholder="Preço"
              value={price}
              onValueChange={setPrice}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const formData = new FormData();
                formData.set("index", String(item.index));
                formData.set("price", price);
                const state = await action(formData);
                if (state?.error) toast.error(state.error);
                if (state?.ok) toast.success(state.ok);
              })
            }
          >
            <PlusIcon />
            Adicionar
          </Button>
        </div>
      )}
    </li>
  );
}
