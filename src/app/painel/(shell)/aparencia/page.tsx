import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCatalog } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase/env";
import { AppearanceForm } from "./appearance-form";
import { CatalogImageField } from "./image-field";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

export default async function AparenciaPage() {
  const catalog = await requireCatalog();

  return (
    <>
      <h1 className="text-xl font-semibold">Aparência</h1>

      <Card>
        <CardHeader>
          <CardTitle>Modelo, layout e cores</CardTitle>
          <CardDescription>
            Use “Pré-visualizar” no topo para ver o resultado depois de salvar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm
            key={`${catalog.layout}${catalog.color_primary}${catalog.color_background}${catalog.color_text}`}
            initial={{
              layout: catalog.layout,
              primary: catalog.color_primary,
              background: catalog.color_background,
              text: catalog.color_text,
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Foto do negócio</CardTitle>
            <CardDescription>Logo ou foto sua. Fica redonda.</CardDescription>
          </CardHeader>
          <CardContent>
            <CatalogImageField
              kind="logo"
              catalogId={catalog.id}
              currentUrl={catalog.logo_path ? mediaUrl(catalog.logo_path) : null}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capa</CardTitle>
            <CardDescription>Imagem larga no topo do catálogo.</CardDescription>
          </CardHeader>
          <CardContent>
            <CatalogImageField
              kind="cover"
              catalogId={catalog.id}
              currentUrl={catalog.cover_path ? mediaUrl(catalog.cover_path) : null}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
