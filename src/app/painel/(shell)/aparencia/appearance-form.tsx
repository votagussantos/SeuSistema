"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { layoutOptions, presets } from "@/lib/presets";
import type { CatalogLayout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { updateAppearance } from "../../actions";

type Look = { layout: CatalogLayout; primary: string; background: string; text: string };

// Miniatura esquemática do catálogo com o layout e as cores escolhidos.
function MiniCatalog({ look, className }: { look: Look; className?: string }) {
  const block = { backgroundColor: look.text, opacity: 0.14 };
  const line = { backgroundColor: look.text, opacity: 0.55 };
  return (
    <div
      aria-hidden
      className={cn("overflow-hidden rounded-md border", className)}
      style={{ backgroundColor: look.background }}
    >
      <div className="h-[22%]" style={{ backgroundColor: look.primary, opacity: 0.85 }} />
      <div className="space-y-[6%] p-[8%]">
        <div className="h-1 w-1/2 rounded-full" style={line} />
        {look.layout === "grade" && (
          <div className="grid grid-cols-2 gap-[6%]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-sm" style={block} />
            ))}
          </div>
        )}
        {look.layout === "lista" &&
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[6%]">
              <div className="flex-1 space-y-1">
                <div className="h-1 w-3/4 rounded-full" style={line} />
                <div className="h-1 w-1/2 rounded-full" style={block} />
              </div>
              <div className="size-4 rounded-sm" style={block} />
            </div>
          ))}
        {look.layout === "destaque" &&
          [0, 1].map((i) => (
            <div key={i} className="space-y-1">
              <div className="aspect-[2/1] rounded-sm" style={block} />
              <div className="h-1 w-2/3 rounded-full" style={line} />
            </div>
          ))}
        <div className="h-2 w-full rounded-full" style={{ backgroundColor: look.primary }} />
      </div>
    </div>
  );
}

const colorFields = [
  { key: "primary", name: "color_primary", label: "Principal" },
  { key: "background", name: "color_background", label: "Fundo" },
  { key: "text", name: "color_text", label: "Texto" },
] as const;

export function AppearanceForm({ initial }: { initial: Look }) {
  const [look, setLook] = useState<Look>(initial);
  const activePreset = presets.find(
    (p) =>
      p.layout === look.layout &&
      p.primary === look.primary &&
      p.background === look.background &&
      p.text === look.text,
  );

  return (
    <ActionForm action={updateAppearance} submitLabel="Salvar aparência" className="grid gap-6">
      <input type="hidden" name="layout" value={look.layout} />

      <section className="grid gap-3">
        <div>
          <h3 className="text-sm font-medium">Modelos prontos</h3>
          <p className="text-xs text-muted-foreground">
            Escolha um ponto de partida; depois ajuste layout e cores como quiser.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePreset?.id === preset.id}
              onClick={() => setLook(preset)}
              className={cn(
                "rounded-xl border p-2 text-left transition-colors hover:bg-muted/60",
                activePreset?.id === preset.id && "border-foreground ring-1 ring-foreground",
              )}
            >
              <MiniCatalog look={preset} className="aspect-[4/5] w-full" />
              <span className="mt-2 block text-sm font-medium">{preset.name}</span>
              <span className="block text-xs text-muted-foreground">{preset.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Layout</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {layoutOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={look.layout === option.value}
              onClick={() => setLook({ ...look, layout: option.value })}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60 sm:flex-col sm:items-stretch",
                look.layout === option.value && "border-foreground ring-1 ring-foreground",
              )}
            >
              <MiniCatalog
                look={{ ...look, layout: option.value }}
                className="aspect-[4/5] w-16 shrink-0 sm:w-full"
              />
              <span>
                <span className="block text-sm font-medium">{option.name}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Cores</h3>
        <div className="grid grid-cols-3 gap-3">
          {colorFields.map((field) => (
            <label key={field.key} className="grid gap-1.5 text-sm font-medium">
              {field.label}
              <input
                type="color"
                name={field.name}
                value={look[field.key]}
                onChange={(event) => setLook({ ...look, [field.key]: event.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border bg-background p-1"
              />
            </label>
          ))}
        </div>
        <p
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ backgroundColor: look.background, color: look.text }}
        >
          Assim fica o texto sobre o fundo.{" "}
          <span style={{ color: look.primary }} className="font-semibold">
            E assim os destaques.
          </span>
        </p>
      </section>
    </ActionForm>
  );
}
