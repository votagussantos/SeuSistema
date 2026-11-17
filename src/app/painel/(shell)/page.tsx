import { CheckCircle2Icon, CircleIcon, ExternalLinkIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { CopyLink } from "@/components/painel/copy-link";
import { InstagramInput, PhoneInput } from "@/components/masked-inputs";
import { Field } from "@/components/painel/field";
import { OnboardingForm, SegmentForm } from "@/components/painel/onboarding-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMyCatalog, getMySuspension } from "@/lib/data";
import { getSegment, nounsFor } from "@/lib/segments";
import { createClient } from "@/lib/supabase/server";
import { createCatalog, setSegment, updateCatalogInfo } from "../actions";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

export default async function PainelPage() {
  const catalog = await getMyCatalog();

  if (!catalog) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Vamos criar seu catálogo</CardTitle>
          <CardDescription>
            Leva um minuto. Com o segmento, a gente já sugere categorias e itens para você
            começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm action={createCatalog} />
        </CardContent>
      </Card>
    );
  }

  const supabase = await createClient();
  const nouns = nounsFor(catalog.segment);
  const segment = getSegment(catalog.segment);
  const [suspension, { data: itemRows }, { data: stockRows }] = await Promise.all([
    getMySuspension(catalog.id),
    supabase.from("items").select("id, name").eq("catalog_id", catalog.id),
    supabase
      .from("item_private")
      .select("item_id, stock_quantity, stock_min")
      .eq("catalog_id", catalog.id)
      .not("stock_quantity", "is", null),
  ]);
  const itemCount = itemRows?.length ?? 0;
  const itemNames = new Map((itemRows ?? []).map((item) => [item.id, item.name]));
  // Alerta: estoque zerado ou no mínimo definido para o item.
  const lowStock = (stockRows ?? []).filter(
    (row) => row.stock_quantity <= (row.stock_min ?? 0) && itemNames.has(row.item_id),
  );

  const steps = [
    { done: Boolean(catalog.whatsapp), label: "Informar o WhatsApp que recebe os pedidos", href: "#dados" },
    { done: itemCount > 0, label: `Cadastrar ${nouns.primeiro}`, href: "/painel/itens/novo" },
    {
      done: Boolean(catalog.logo_path || catalog.cover_path),
      label: "Enviar a foto ou a capa do negócio",
      href: "/painel/aparencia",
    },
    { done: catalog.published, label: "Publicar o catálogo", href: "#dados" },
  ];
  const pending = steps.filter((step) => !step.done);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{catalog.name}</CardTitle>
            {suspension ? (
              <Badge variant="destructive">Suspenso</Badge>
            ) : catalog.published ? (
              <Badge>Publicado</Badge>
            ) : (
              <Badge variant="secondary">Rascunho</Badge>
            )}
          </div>
          <CardDescription className="font-mono">/{catalog.slug}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {suspension && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Este catálogo foi tirado do ar pela administração.
              {suspension.reason && ` Motivo: ${suspension.reason}`}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {catalog.published && !suspension && (
              <a
                href={`/${catalog.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm" })}
              >
                <ExternalLinkIcon />
                Abrir catálogo
              </a>
            )}
            <CopyLink path={`/${catalog.slug}`} />
          </div>
          {pending.length > 0 && (
            <div>
              <p className="text-sm font-medium">Próximos passos</p>
              <ul className="mt-2 grid gap-1.5">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-2 text-sm">
                    {step.done ? (
                      <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    {step.done ? (
                      <span className="text-muted-foreground line-through">{step.label}</span>
                    ) : (
                      <Link href={step.href} className="underline underline-offset-4">
                        {step.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {!catalog.segment && (
        <Card>
          <CardHeader>
            <CardTitle>Qual é o seu segmento?</CardTitle>
            <CardDescription>
              Com isso o painel usa os nomes certos para o seu negócio e sugere categorias e
              itens prontos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentForm action={setSegment} initial="" />
          </CardContent>
        </Card>
      )}

      {lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlertIcon className="size-4 text-amber-600" />
              Estoque baixo
            </CardTitle>
            <CardDescription>No mínimo que você definiu, ou abaixo dele.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {lowStock.map((row) => (
                <li key={row.item_id} className="py-2 first:pt-0 last:pb-0">
                  <Link
                    href={`/painel/itens/${row.item_id}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium">{itemNames.get(row.item_id)}</span>
                    <span className="text-muted-foreground">
                      {row.stock_quantity === 0 ? "Sem estoque" : `${row.stock_quantity} em estoque`}
                      {row.stock_min != null && ` · mínimo ${row.stock_min}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {catalog.segment && segment.categories.length > 0 && itemCount < 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Sugestões para {segment.name.toLowerCase()}</CardTitle>
            <CardDescription>
              Categorias e {nouns.plural} mais comuns do seu segmento, para adicionar com um toque.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/painel/sugestoes" className={buttonVariants({ variant: "outline" })}>
              Ver sugestões
            </Link>
          </CardContent>
        </Card>
      )}

      <Card id="dados" className="scroll-mt-28">
        <CardHeader>
          <CardTitle>Dados e contato</CardTitle>
          <CardDescription>Aparecem no topo do seu catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={updateCatalogInfo}>
            <Field label="Nome do negócio" htmlFor="name">
              <Input id="name" name="name" required maxLength={80} defaultValue={catalog.name} />
            </Field>
            <Field label="Descrição" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                defaultValue={catalog.description ?? ""}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp" htmlFor="whatsapp" hint="Os pedidos chegam neste número.">
                <PhoneInput id="whatsapp" name="whatsapp" defaultValue={catalog.whatsapp ?? ""} />
              </Field>
              <Field label="Instagram" htmlFor="instagram" hint="Só o nome de usuário.">
                <InstagramInput
                  id="instagram"
                  name="instagram"
                  placeholder="seuusuario"
                  defaultValue={catalog.instagram ?? ""}
                />
              </Field>
              <Field label="E-mail de contato" htmlFor="contact_email">
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={catalog.contact_email ?? ""}
                />
              </Field>
              <Field label="Cidade" htmlFor="city">
                <Input id="city" name="city" maxLength={80} defaultValue={catalog.city ?? ""} />
              </Field>
            </div>
            <Field label="Endereço" htmlFor="address">
              <Input
                id="address"
                name="address"
                maxLength={200}
                defaultValue={catalog.address ?? ""}
              />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                name="published"
                defaultChecked={catalog.published}
                className="mt-0.5 size-4 accent-foreground"
              />
              <span>
                <span className="block font-medium">Catálogo publicado</span>
                <span className="block text-muted-foreground">
                  Visível para qualquer pessoa com o link. Desmarcado, só você vê pela
                  pré-visualização.
                </span>
              </span>
            </label>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
