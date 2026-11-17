import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { selectClass } from "@/components/painel/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { setPlan, setSuspended } from "./actions";

// Depende da sessão do dono: a navegação espera o servidor, sem validação de "instantâneo".
export const instant = false;

type Row = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  suspended: boolean;
  created_at: string;
  owner_id: string;
  owner_email: string;
  plan_id: string;
  plan_valid_until: string | null;
  item_count: number;
};

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function AdminPage() {
  // Para quem não é administrador, a página simplesmente não existe.
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_catalogs");
  if (error) throw new Error(error.message);
  const rows: Row[] = data ?? [];

  const stats = [
    { label: "Catálogos", value: rows.length },
    { label: "Publicados", value: rows.filter((r) => r.published && !r.suspended).length },
    { label: "No plano Pro", value: new Set(rows.filter((r) => r.plan_id === "pro").map((r) => r.owner_id)).size },
    { label: "Suspensos", value: rows.filter((r) => r.suspended).length },
  ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-2xl font-bold">{stat.value}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum catálogo criado ainda.</p>
      )}

      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{row.name}</CardTitle>
              {row.suspended ? (
                <Badge variant="destructive">Suspenso</Badge>
              ) : row.published ? (
                <Badge>Publicado</Badge>
              ) : (
                <Badge variant="secondary">Rascunho</Badge>
              )}
              <Badge variant="outline">{row.plan_id === "pro" ? "Pro" : "Grátis"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {row.published && !row.suspended ? (
                <a
                  href={`/${row.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline underline-offset-4"
                >
                  /{row.slug}
                </a>
              ) : (
                <span className="font-mono">/{row.slug}</span>
              )}{" "}
              · {row.owner_email} · {row.item_count} {row.item_count === 1 ? "item" : "itens"} ·
              criado em {date.format(new Date(row.created_at))}
              {row.plan_valid_until && ` · Pro até ${date.format(new Date(row.plan_valid_until))}`}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ActionForm
              action={setPlan}
              submitLabel="Salvar plano"
              className="grid content-start gap-2"
            >
              <input type="hidden" name="owner_id" value={row.owner_id} />
              <label className="grid gap-1.5 text-sm font-medium">
                Plano da conta
                <select name="plan_id" defaultValue={row.plan_id} className={selectClass}>
                  <option value="free">Grátis</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Pro válido até (vazio = sem prazo)
                <Input
                  type="date"
                  name="valid_until"
                  defaultValue={row.plan_valid_until?.slice(0, 10) ?? ""}
                />
              </label>
            </ActionForm>

            <ActionForm
              action={setSuspended}
              submitLabel={row.suspended ? "Reativar catálogo" : "Suspender catálogo"}
              className="grid content-start gap-2"
            >
              <input type="hidden" name="catalog_id" value={row.id} />
              <input type="hidden" name="slug" value={row.slug} />
              <input type="hidden" name="suspended" value={row.suspended ? "false" : "true"} />
              {!row.suspended && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Motivo (o dono vê no painel)
                  <Input name="reason" maxLength={300} placeholder="Opcional" />
                </label>
              )}
            </ActionForm>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
