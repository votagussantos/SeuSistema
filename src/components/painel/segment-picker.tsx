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
  const selected = segments.find((segment) => segment.id === value);
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-medium">Qual é o seu segmento?</legend>
      {groups.map((group) => (
        <div key={group.id} className="grid gap-2">
          <p className="eyebrow">{group.title}</p>
          <div className="overflow-hidden rounded-lg border bg-background">
            {segments
              .filter((segment) => segment.group === group.id)
              .map((segment) => (
                <label
                  key={segment.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 border-b px-4 py-2 last:border-b-0 hover:bg-muted/40",
                    value === segment.id && "bg-muted/60 shadow-[inset_2px_0_0_var(--foreground)]",
                  )}
                >
                  <input
                    type="radio"
                    name="segment"
                    value={segment.id}
                    checked={value === segment.id}
                    onChange={() => onChange(segment.id)}
                    className="size-4 accent-foreground"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("text-sm", value === segment.id && "font-medium")}>
                      {segment.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{segment.hint}</span>
                  </span>
                  {segment.categories.length > 0 && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {segment.categories.length} CAT.
                    </span>
                  )}
                </label>
              ))}
          </div>
        </div>
      ))}
      {selected && selected.categories.length > 0 && (
        <div className="grid gap-1 border-t pt-4">
          <p className="eyebrow">Já vem pronto</p>
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            {[...new Set(selected.categories.map((path) => path[0]))].join(" · ")}
            <br />
            {selected.items.length} {selected.noun.plural} sugeridos
          </p>
        </div>
      )}
    </fieldset>
  );
}
