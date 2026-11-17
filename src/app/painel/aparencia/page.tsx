import { ActionForm } from "@/components/action-form";
import { requireCatalog } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase/env";
import { ui } from "@/lib/ui";
import { updateAppearance } from "../actions";
import { CatalogImageField } from "./image-field";

const layouts = [
  { value: "grade", name: "Grade", hint: "Vitrine em colunas. Bom para produtos." },
  { value: "lista", name: "Lista", hint: "Estilo cardápio. Bom para serviços e comida." },
  { value: "destaque", name: "Destaque", hint: "Fotos grandes, um item por vez." },
];

const colors = [
  { name: "color_primary", label: "Cor principal (botões e destaques)" },
  { name: "color_background", label: "Cor de fundo" },
  { name: "color_text", label: "Cor do texto" },
] as const;

export default async function AparenciaPage() {
  const catalog = await requireCatalog();

  return (
    <>
      <h1 className={ui.h1}>Aparência</h1>

      <section className={ui.card}>
        <h2 className={ui.h2}>Foto do negócio</h2>
        <div className="mt-4">
          <CatalogImageField
            kind="logo"
            catalogId={catalog.id}
            currentUrl={catalog.logo_path ? mediaUrl(catalog.logo_path) : null}
          />
        </div>
      </section>

      <section className={ui.card}>
        <h2 className={ui.h2}>Capa</h2>
        <div className="mt-4">
          <CatalogImageField
            kind="cover"
            catalogId={catalog.id}
            currentUrl={catalog.cover_path ? mediaUrl(catalog.cover_path) : null}
          />
        </div>
      </section>

      <section className={ui.card}>
        <h2 className={ui.h2}>Layout e cores</h2>
        <div className="mt-4">
          <ActionForm action={updateAppearance}>
            <fieldset className="space-y-2">
              <legend className={ui.label}>Layout</legend>
              {layouts.map((layout) => (
                <label
                  key={layout.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 has-checked:border-zinc-900"
                >
                  <input
                    type="radio"
                    name="layout"
                    value={layout.value}
                    defaultChecked={catalog.layout === layout.value}
                    className="mt-1 size-4"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900">{layout.name}</span>
                    <span className="block text-sm text-zinc-600">{layout.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-3">
              {colors.map((color) => (
                <div key={color.name}>
                  <label htmlFor={color.name} className={ui.label}>
                    {color.label}
                  </label>
                  <input
                    id={color.name}
                    name={color.name}
                    type="color"
                    defaultValue={catalog[color.name]}
                    className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
                  />
                </div>
              ))}
            </div>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
