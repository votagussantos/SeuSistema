"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { centsToMoney, MoneyInput } from "@/components/masked-inputs";
import { Switch } from "@/components/ui/switch";
import { setItemAvailable, updateItemPrice } from "../../actions";

// Preço editável na lista: salva ao sair do campo ou ao apertar Enter.
export function QuickPrice({ id, name, cents }: { id: string; name: string; cents: number | null }) {
  const saved = centsToMoney(cents);
  const [value, setValue] = useState(saved);
  const [pending, startTransition] = useTransition();

  function save() {
    if (value === saved) return;
    startTransition(async () => {
      const state = await updateItemPrice(id, value);
      if (state?.error) {
        toast.error(state.error);
        setValue(saved);
      } else if (state?.ok) {
        toast.success(`${name}: R$ ${value}`);
      }
    });
  }

  return (
    <div className="w-28 shrink-0">
      <MoneyInput
        aria-label={`Preço de ${name}`}
        value={value}
        disabled={pending}
        onValueChange={setValue}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setValue(saved);
            event.currentTarget.blur();
          }
        }}
        className="h-9 text-right font-mono text-sm"
      />
    </div>
  );
}

// Chave de venda: pausa sem apagar o item.
export function QuickAvailable({ id, name, available }: { id: string; name: string; available: boolean }) {
  const [checked, setChecked] = useState(available);
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={`${name} à venda`}
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const state = await setItemAvailable(id, next);
          if (state?.error) {
            toast.error(state.error);
            setChecked(!next);
          }
        });
      }}
    />
  );
}
