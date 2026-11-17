"use client";

import { segments } from "@/lib/segments";
import { cn } from "@/lib/utils";

const groups = [
  { id: "produtos", title: "Vendo produtos" },
  { id: "servicos", title: "Presto serviços" },
  { id: "outro", title: "Nenhum desses" },
] as const;

// Escolha do segmento. Envia o valor no campo "segment" do formulário.
export function SegmentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-medium">Qual é o seu segmento?</legend>
      <input type="hidden" name="segment" value={value} />
      {groups.map((group) => (
        <div key={group.id} className="grid gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {segments
              .filter((segment) => segment.group === group.id)
              .map((segment) => (
                <button
                  key={segment.id}
                  type="button"
                  aria-pressed={value === segment.id}
                  onClick={() => onChange(segment.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors hover:bg-muted/60",
                    value === segment.id && "border-foreground bg-muted ring-1 ring-foreground",
                  )}
                >
                  <span className="block text-sm font-medium">{segment.name}</span>
                  <span className="block text-xs text-muted-foreground">{segment.hint}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
