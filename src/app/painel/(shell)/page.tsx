import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { InstagramInput, PhoneInput } from "@/components/masked-inputs";
import { Field } from "@/components/painel/field";
import { OnboardingForm, SegmentForm } from "@/components/painel/onboarding-form";
import { ShareLink } from "@/components/painel/share-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMyCatalog, getMyPlan, getMySuspension } from "@/lib/data";
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
  const [plan, suspension, { data: itemRows }, { data: imageRows }, { data: privateRows }] =
    await Promise.all([
      getMyPlan(),
      getMySuspension(catalog.id),
      supabase
        .from("items")
        .select("id, name, available, price_cents, promo_price_cents")
        .eq("catalog_id", catalog.id),
      supabase.from("item_images").select("item_id").eq("catalog_id", catalog.id),
      supabase
        .from("item_private")
        .select("item_id, cost_cents, stock_quantity, stock_min")
        .eq("catalog_id", catalog.id),
    ]);
  const items = itemRows ?? [];
  const withPhoto = new Set((imageRows ?? []).map((row) => row.item_id));
  const internal = new Map((privateRows ?? []).map((row) => [row.item_id, row]));
  const noPhoto = items.filter((item) => !withPhoto.has(item.id));
  // Estoque zerado ou no mínimo definido para o item.
  const lowStock = items.filter((item) => {
    const row = internal.get(item.id);
    return row?.stock_quantity != null && row.stock_quantity <= (row.stock_min ?? 0);
  });
  const margins = items.flatMap((item) => {
    const price = item.promo_price_cents ?? item.price_cents;
    const cost = internal.get(item.id)?.cost_cents;
    return price && cost != null ? [(price - cost) / price] : [];
  });
  const avgMargin = margins.length
    ? `${Math.round((margins.reduce((a, b) => a + b, 0) / margins.length) * 100)}%`
    : "—";

  const steps = [
    { done: Boolean(catalog.segment), label: "Escolher o segmento", hint: "Para sugerirmos categorias e itens.", href: "#segmento", cta: "Escolher" },
    { done: Boolean(catalog.whatsapp), label: "Informar o WhatsApp", hint: "É por ele que os pedidos chegam.", href: "#dados", cta: "Informar" },
    { done: items.length > 0, label: `Cadastrar ${nouns.primeiro}`, hint: "Ou adicione os sugeridos do seu segmento.", href: segment.items.length > 0 ? "/painel/sugestoes" : "/painel/itens/novo", cta: "Cadastrar" },
    { done: items.length > 0 && noPhoto.length === 0, label: "Colocar foto em todos", hint: "Com foto o cliente decide mais rápido.", href: "/painel/itens?filtro=sem-foto", cta: "Resolver" },
    { done: catalog.published, label: "Publicar o catálogo", hint: "Marque “Catálogo publicado” nos dados abaixo.", href: "#dados", cta: "Publicar" },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const current = steps.find((step) => !step.done);

  return (
    <>
      {suspension && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Este catálogo foi tirado do ar pela administração.
          {suspension.reason && ` Motivo: ${suspension.reason}`}
        </p>
      )}

      {current && (
        <section className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Configuração</h1>
            <span className="font-mono text-sm text-muted-foreground">
              {doneCount} / {steps.length}
            </span>
          </div>
          <div className="h-1 rounded-full bg-border" aria-hidden>
            <div
              className="h-1 rounded-full bg-foreground"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <ol className="overflow-hidden rounded-xl border bg-background">
            {steps.map((step) => {
              const isCurrent = step === current;
              return (
                <li
                  key={step.label}
                  className={`flex min-h-12 items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0 ${isCurrent ? "bg-muted/60" : ""}`}
                >
                  {step.done ? (
                    <CheckIcon aria-label="Feito" className="size-4 shrink-0 text-success" />
                  ) : (
                    <CircleIcon aria-label="Pendente" className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={step.done ? "text-muted-foreground line-through" : isCurrent ? "font-medium" : ""}>
                      {step.label}
                    </span>
                    {isCurrent && <span className="text-xs text-muted-foreground">{step.hint}</span>}
                  </span>
                  {isCurrent && (
                    <Link href={step.href} className={buttonVariants({ size: "sm" })}>
                      {step.cta}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {!catalog.segment && (
        <Card id="segmento" className="scroll-mt-28">
          <CardHeader>
            <CardTitle>Qual é o seu segmento?</CardTitle>
            <CardDescription>
              O painel passa a usar os nomes certos para o seu negócio e sugere categorias e
              itens prontos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentForm action={setSegment} initial="" />
          </CardContent>
        </Card>
      )}

      {(lowStock.length > 0 || noPhoto.length > 0 || !catalog.whatsapp) && (
        <section className="grid gap-2">
          <h2 className="eyebrow">Atenção</h2>
          <ul className="overflow-hidden rounded-xl border bg-background">
            {!catalog.whatsapp && (
              <AttentionRow href="#dados" dot="bg-destructive" label="Sem WhatsApp, os pedidos não chegam" />
            )}
            {lowStock.map((item) => {
              const row = internal.get(item.id)!;
              return (
                <AttentionRow
                  key={item.id}
                  href={`/painel/itens/${item.id}`}
                  dot="bg-warning"
                  label={item.name}
                  meta={row.stock_quantity === 0 ? "sem estoque" : `resta ${row.stock_quantity}`}
                />
              );
            })}
            {noPhoto.length > 0 && (
              <AttentionRow
                href="/painel/itens?filtro=sem-foto"
                dot="bg-muted-foreground/60"
                label={`${noPhoto.length} ${noPhoto.length === 1 ? nouns.singular : nouns.plural} sem foto`}
              />
            )}
          </ul>
        </section>
      )}

      <section className="grid gap-2">
        <h2 className="eyebrow">Resumo</h2>
        <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-background sm:grid-cols-4">
          {[
            { label: "à venda", value: items.filter((item) => item.available).length },
            { label: "margem média", value: avgMargin },
            { label: "sem foto", value: noPhoto.length },
            { label: "vagas no plano", value: Math.max(0, plan.max_items - items.length) },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-1 p-4 ${index % 2 === 0 ? "border-r" : "sm:border-r"} ${index < 2 ? "border-b sm:border-b-0" : ""} last:border-r-0`}
            >
              <dd className="font-mono text-2xl tracking-tight">{stat.value}</dd>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-2">
        <h2 className="eyebrow">Seu link</h2>
        <ShareLink path={`/${catalog.slug}`} published={catalog.published && !suspension} />
      </section>

      {catalog.segment && segment.categories.length > 0 && items.length < 3 && (
        <Link
          href="/painel/sugestoes"
          className="flex items-center gap-3 rounded-xl border border-dashed bg-background px-4 py-3 text-sm hover:bg-muted/60"
        >
          <span className="flex-1">
            <span className="block font-medium">Sugestões para {segment.name.toLowerCase()}</span>
            <span className="block text-muted-foreground">
              Categorias e {nouns.plural} mais comuns, para adicionar com um toque.
            </span>
          </span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </Link>
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

function AttentionRow({
  href,
  dot,
  label,
  meta,
}: {
  href: string;
  dot: string;
  label: string;
  meta?: string;
}) {
  return (
    <li className="border-b last:border-b-0">
      <Link href={href} className="flex min-h-12 items-center gap-3 px-4 text-sm hover:bg-muted/60">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot}`} />
        <span className="flex-1">{label}</span>
        {meta && <span className="font-mono text-xs text-muted-foreground">{meta}</span>}
        <ChevronRightIcon className="size-4 text-muted-foreground/60" />
      </Link>
    </li>
  );
}
