import Link from "next/link";
import type React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Conte o que você vende", text: "Restaurante, doces, moda, salão, estética. As categorias e o visual já vêm prontos." },
  { title: "Confira os preços", text: "Os produtos mais comuns do seu ramo aparecem sugeridos. Informe o preço e adicione." },
  { title: "Divulgue o link", text: "Na bio e no status. O cliente monta a sacola e o pedido chega pronto no WhatsApp." },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    note: "Para começar a vender hoje.",
    items: ["1 catálogo", "30 produtos", "3 fotos por produto", "Pedidos ilimitados"],
    cta: true,
  },
  {
    name: "Pro",
    price: "Em breve",
    note: "Para quem cresceu.",
    items: ["3 catálogos", "300 produtos", "8 fotos por produto", "Sem o selo “Feito com SeuSistema”"],
    cta: false,
  },
];

const faq = [
  { q: "Preciso pagar alguma coisa?", a: "Não. O plano grátis não tem prazo e não pede cartão." },
  { q: "O cliente paga pelo catálogo?", a: "Não. O pedido vai para o seu WhatsApp e vocês combinam pagamento e entrega." },
  { q: "Meu cliente precisa baixar algum app?", a: "Não. Ele abre o link, escolhe e envia." },
  { q: "Serve para quem presta serviço?", a: "Sim. Tem duração, preço “a partir de” e “sob consulta”." },
];

const products = [
  { name: "Brigadeiro gourmet", price: "R$ 4,50", margin: "62%", stock: "40", low: false },
  { name: "Bolo de pote", price: "R$ 12,00", margin: "48%", stock: "1", low: true },
  { name: "Bolo de aniversário", price: "R$ 90,00", margin: "55%", stock: "—", low: false },
  { name: "Cento de salgados", price: "R$ 85,00", margin: "41%", stock: "—", low: false },
];

// Recorte ilustrativo do painel e do catálogo, feito com a própria interface.
function ProductPreview() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-5xl items-end gap-6 px-4">
      <div className="min-w-0 flex-1 overflow-hidden rounded-t-xl border border-b-0 bg-background">
        <div className="flex h-10 items-center gap-2 border-b bg-muted/50 px-4">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
            seusistema.app/painel/produtos
          </span>
        </div>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="text-lg font-semibold tracking-tight">Produtos</span>
          <span className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">Novo produto</span>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b bg-muted/40 px-5 py-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase max-sm:grid-cols-[2fr_1fr_1fr]">
          <span>Produto</span>
          <span>Preço</span>
          <span>Margem</span>
          <span className="max-sm:hidden">Estoque</span>
        </div>
        {products.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center border-b px-5 py-3 text-sm last:border-b-0 max-sm:grid-cols-[2fr_1fr_1fr]"
          >
            <span className="truncate font-medium">{row.name}</span>
            <span className="font-mono">{row.price}</span>
            <span className="font-mono">{row.margin}</span>
            <span className="flex items-center gap-1.5 font-mono max-sm:hidden">
              {row.low && <span className="size-2 rounded-full bg-warning" />}
              {row.stock}
            </span>
          </div>
        ))}
      </div>
      <div className="w-56 shrink-0 overflow-hidden rounded-t-2xl border border-b-0 bg-[#FFF5F7] pb-4 max-md:hidden">
        <div className="h-16 bg-[#F9A8D4]" />
        <div className="px-3.5">
          <span className="-mt-5 flex size-11 items-center justify-center rounded-lg border-3 border-[#FFF5F7] bg-[#DB2777] font-semibold text-white">
            D
          </span>
          <p className="mt-1.5 mb-2.5 text-sm font-semibold text-[#3B0A1E]">Doces da Maria</p>
          <div className="grid grid-cols-2 gap-2">
            {["#FBCFE8", "#FDE68A"].map((color, index) => (
              <div key={color}>
                <div className="aspect-square rounded-md" style={{ backgroundColor: color }} />
                <p className="mt-1 font-mono text-[11px] text-[#3B0A1E]">{index ? "R$ 4,50" : "R$ 12,00"}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex justify-between rounded-md bg-[#DB2777] px-3 py-2 font-mono text-[11px] text-white">
            <span>SACOLA · 3</span>
            <span>R$ 33,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-4">
          <span className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span aria-hidden className="size-5 rounded-[5px] bg-foreground" />
            SeuSistema
          </span>
          <nav aria-label="Seções" className="flex flex-1 gap-5 text-sm text-muted-foreground max-sm:hidden">
            <a href="#como" className="hover:text-foreground">Como funciona</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
            <a href="#faq" className="hover:text-foreground">Perguntas</a>
          </nav>
          <Link href="/entrar" className="text-sm text-muted-foreground hover:text-foreground max-sm:ml-auto">
            Entrar
          </Link>
          <Link href="/entrar" className={buttonVariants({ size: "sm" })}>
            Criar catálogo
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:56px_56px]">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 pt-20 pb-14 sm:pt-24">
            <p className="eyebrow rounded-md border bg-background px-2.5 py-1.5">
              Catálogo online · grátis · sem senha
            </p>
            <h1 className="max-w-3xl bg-background/70 text-5xl leading-[0.98] font-semibold tracking-[-0.05em] text-balance sm:text-7xl">
              O catálogo do seu negócio. Pedidos direto no WhatsApp.
            </h1>
            <p className="max-w-xl bg-background/80 text-lg leading-relaxed text-muted-foreground">
              Diga o que você vende. A gente monta categorias, sugere produtos e escolhe o visual.
              Você confere os preços e divulga o link.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/entrar" className={buttonVariants({ size: "lg" })}>
                Criar meu catálogo grátis
              </Link>
              <a href="#como" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Como funciona
              </a>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="como" className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 pt-16">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
              <h2 className="text-4xl font-semibold tracking-[-0.04em]">Do zero ao link em três passos.</h2>
              <p className="eyebrow">Como funciona</p>
            </div>
            <ol className="grid border-t border-l sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-3 border-r border-b p-6 sm:min-h-52">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b bg-muted/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 className="pb-8 text-4xl font-semibold tracking-[-0.04em]">Menos trabalho para quem vende.</h2>
            <div className="grid border-t border-l bg-background sm:grid-cols-2 lg:grid-cols-3">
              <Feature eyebrow="Pedido" title="Chega pronto no WhatsApp" text="Itens, sabores, quantidades e total. Nada para digitar.">
                <pre className="rounded-md border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {"20x Brigadeiro (Tradicional)  R$ 90,00\n2x Bolo de pote  R$ 24,00\nTotal  R$ 114,00"}
                </pre>
              </Feature>
              <Feature eyebrow="Próximo passo" title="Você sempre sabe o que falta" text="O painel mostra o próximo passo até o catálogo ficar completo.">
                <div className="h-1 rounded-full bg-border">
                  <div className="h-1 w-3/5 rounded-full bg-foreground" />
                </div>
                <p className="font-mono text-xs text-muted-foreground">3 / 5 · FOTO EM TODOS</p>
              </Feature>
              <Feature eyebrow="Estoque" title="Avisa antes de acabar" text="Defina o mínimo de cada produto. O alerta aparece sozinho.">
                <p className="flex items-center gap-2 text-sm">
                  <span className="size-2 rounded-full bg-warning" />
                  Bolo de pote
                  <span className="ml-auto font-mono text-xs">1 / MÍN. 5</span>
                </p>
              </Feature>
              <Feature eyebrow="Margem" title="Mostra quanto você ganha" text="Informe o custo e veja o lucro de cada venda enquanto digita.">
                <p className="font-mono text-3xl tracking-tight">
                  +R$ 2,80 <span className="text-sm text-muted-foreground">· 62%</span>
                </p>
              </Feature>
              <Feature eyebrow="Celular" title="Cadastre pela câmera" text="Fotos reduzidas no envio. O catálogo abre rápido até com internet fraca." />
              <Feature eyebrow="Marca" title="Com as suas cores" text="Capa, foto e cores do seu negócio. O catálogo é seu, não nosso.">
                <div className="flex gap-1.5">
                  {["#DB2777", "#B45309", "#6D28D9", "#0B0B0F", "#166534"].map((color) => (
                    <span key={color} className="size-7 rounded-md" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </Feature>
            </div>
          </div>
        </section>

        <section id="planos" className="border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 className="pb-8 text-4xl font-semibold tracking-[-0.04em]">Planos</h2>
            <div className="grid overflow-hidden rounded-xl border sm:grid-cols-2">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={cn("flex flex-col gap-4 p-7", index === 0 ? "max-sm:border-b sm:border-r" : "bg-muted/40")}
                >
                  <p className="eyebrow">{plan.name}</p>
                  <p className="font-mono text-4xl tracking-tight">{plan.price}</p>
                  <p className="text-[15px] text-muted-foreground">{plan.note}</p>
                  <ul className="font-mono text-[13px] leading-loose text-muted-foreground">
                    {plan.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {plan.cta && (
                    <Link href="/entrar" className={cn(buttonVariants(), "self-start")}>
                      Começar grátis
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-b">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 md:grid-cols-[1fr_2fr]">
            <h2 className="text-4xl font-semibold tracking-[-0.04em]">Perguntas frequentes</h2>
            <div className="border-b">
              {faq.map((entry) => (
                <details key={entry.q} className="group border-t py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                    {entry.q}
                    <span aria-hidden className="font-mono text-muted-foreground group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{entry.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-6 px-4 py-20">
            <h2 className="max-w-2xl text-5xl font-semibold tracking-[-0.045em]">
              Seu catálogo no ar ainda hoje.
            </h2>
            <Link href="/entrar" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              Criar meu catálogo grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl justify-between px-4 py-6 text-sm text-muted-foreground">
        <span>SeuSistema</span>
        <span className="font-mono text-xs">FEITO NO BRASIL</span>
      </footer>
    </div>
  );
}

function Feature({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col gap-3 border-r border-b p-6">
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{text}</p>
      {children && <div className="mt-auto grid gap-2 pt-2">{children}</div>}
    </div>
  );
}
