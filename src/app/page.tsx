import {
  ImageIcon,
  LayoutGridIcon,
  MessageCircleIcon,
  PaletteIcon,
  SearchIcon,
  SmartphoneIcon,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Crie sua conta", text: "Entre com o Google ou com seu e-mail. Não precisa de senha nem de cartão." },
  { title: "Monte o catálogo", text: "Cadastre produtos e serviços com fotos, preços e variações. Escolha um modelo e as cores." },
  { title: "Divulgue o link", text: "Coloque na bio do Instagram e envie no WhatsApp. Os pedidos chegam prontos para você." },
];

const features = [
  { icon: MessageCircleIcon, title: "Pedidos no WhatsApp", text: "O cliente monta a sacola e envia o pedido já organizado, com itens, variações e total." },
  { icon: LayoutGridIcon, title: "Produtos e serviços", text: "Venda os dois no mesmo lugar, com categorias e subcategorias para organizar tudo." },
  { icon: PaletteIcon, title: "Com a sua cara", text: "Capa, foto, cores e modelos prontos. O catálogo leva a sua marca, não a nossa." },
  { icon: SmartphoneIcon, title: "Feito para o celular", text: "Abre rápido em qualquer aparelho, mesmo com internet fraca." },
  { icon: ImageIcon, title: "Fotos leves", text: "As imagens são reduzidas automaticamente no envio, sem perder qualidade na tela." },
  { icon: SearchIcon, title: "Busca no catálogo", text: "Seu cliente encontra o que procura em segundos, mesmo com muitos itens." },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    note: "para sempre",
    items: ["1 catálogo", "30 itens", "3 fotos por item", "Todos os modelos e cores", "Pedidos ilimitados no WhatsApp"],
    cta: "Começar grátis",
    highlight: true,
  },
  {
    name: "Pro",
    price: "Em breve",
    note: "para quem cresceu",
    items: ["3 catálogos", "300 itens", "8 fotos por item", "Sem o selo “Feito com SeuSistema”"],
    cta: null,
    highlight: false,
  },
];

const faq = [
  { q: "Preciso pagar alguma coisa?", a: "Não. O plano grátis não tem prazo e não pede cartão." },
  { q: "O pagamento é feito pelo catálogo?", a: "Não. O catálogo organiza o pedido e envia para o seu WhatsApp. Pagamento e entrega você combina direto com o cliente, do jeito que já faz hoje." },
  { q: "Meu cliente precisa instalar algo ou criar conta?", a: "Não. Ele abre o link, escolhe os itens e envia o pedido." },
  { q: "Serve para quem presta serviço?", a: "Sim. Dá para cadastrar serviços com duração, preço “a partir de” ou “sob consulta”." },
];

// Miniatura ilustrativa de um catálogo, feita só com blocos.
function PhoneMock() {
  const items = ["Bolo de pote", "Brigadeiro", "Torta de limão", "Cookie"];
  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[17rem] rounded-[2rem] border-8 border-foreground bg-[#fff5f7] shadow-xl"
    >
      <div className="h-20 rounded-t-[1.4rem] bg-[#db2777]" />
      <div className="px-4 pb-4">
        <div className="-mt-7 flex size-14 items-center justify-center rounded-full border-4 border-[#fff5f7] bg-[#3b0a1e] text-xl font-bold text-white">
          D
        </div>
        <p className="mt-2 text-sm font-bold text-[#3b0a1e]">Doces da Maria</p>
        <p className="text-[0.65rem] text-[#3b0a1e]/70">Encomendas para festas</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {items.map((name, index) => (
            <div key={name} className="overflow-hidden rounded-xl bg-[#3b0a1e]/5">
              <div
                className="aspect-square"
                style={{ backgroundColor: ["#fbcfe8", "#fde68a", "#bbf7d0", "#fed7aa"][index] }}
              />
              <p className="px-2 pt-1.5 text-[0.65rem] font-medium text-[#3b0a1e]">{name}</p>
              <p className="px-2 pb-2 text-[0.65rem] font-bold text-[#3b0a1e]">
                R$ {[12, 4, 15, 8][index]},00
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-full bg-[#db2777] px-3 py-2 text-[0.65rem] font-semibold text-white">
          <span>Ver sacola (2)</span>
          <span>R$ 16,00</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold tracking-tight">SeuSistema</span>
        <Link href="/entrar" className={buttonVariants({ variant: "outline" })}>
          Entrar
        </Link>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-10 sm:grid-cols-[1.2fr_1fr] sm:py-16">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Para quem vende produtos ou presta serviços
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Seu catálogo online, grátis, com pedidos no WhatsApp.
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground">
              Monte em minutos um catálogo com a cara do seu negócio. Seu cliente escolhe, e o
              pedido chega pronto na sua conversa.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/entrar" className={buttonVariants({ size: "lg" })}>
                Criar meu catálogo grátis
              </Link>
              <span className="text-sm text-muted-foreground">Sem cartão. Sem senha.</span>
            </div>
          </div>
          <PhoneMock />
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-14">
            <h2 className="text-2xl font-bold tracking-tight">Como funciona</h2>
            <ol className="mt-6 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight">Tudo o que um catálogo precisa</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <feature.icon className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-14">
            <h2 className="text-2xl font-bold tracking-tight">Planos</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-background p-6",
                    plan.highlight && "border-foreground",
                  )}
                >
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.note}</p>
                  <ul className="mt-4 grid gap-2 text-sm">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {plan.cta && (
                    <Link href="/entrar" className={cn(buttonVariants(), "mt-6")}>
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-14">
          <h2 className="text-2xl font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-6 divide-y border-y">
            {faq.map((entry) => (
              <details key={entry.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {entry.q}
                    <span aria-hidden className="text-muted-foreground group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{entry.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-14">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Comece hoje. Leva poucos minutos.
            </h2>
            <Link href="/entrar" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Criar meu catálogo grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        SeuSistema
      </footer>
    </div>
  );
}
