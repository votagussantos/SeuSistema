"use client";

import { ShoppingBagIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { buildOrderLink, buildOrderText } from "@/lib/whatsapp";
import { QtyStepper } from "./item-trigger";

export function CartBar({
  slug,
  catalogName,
  whatsapp,
}: {
  slug: string;
  catalogName: string;
  whatsapp: string | null;
}) {
  const cart = useCart(slug);
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  if (cart.count === 0) return null;

  const totalLabel =
    cart.totalCents > 0
      ? `${formatBRL(cart.totalCents)}${cart.hasOnRequest ? " + consulta" : ""}`
      : "Sob consulta";
  const order = { catalogName, lines: cart.lines, customerName, notes };
  const input =
    "mt-1.5 block w-full rounded-md border border-(--c-text)/20 bg-transparent px-3 py-2.5 text-base outline-none focus:border-(--c-primary)";
  const label = "block font-mono text-[11px] tracking-[0.08em] uppercase opacity-70";

  return (
    <>
      {/* Espaço para a barra fixa não cobrir o fim da página. */}
      <div className="h-20" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-10 p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex h-13 w-full max-w-lg items-center gap-3 rounded-lg bg-(--c-primary) px-4 text-sm font-medium text-(--c-on-primary) shadow-lg"
        >
          <ShoppingBagIcon className="size-4" aria-hidden />
          <span className="flex-1 text-left">Ver sacola</span>
          <span className="font-mono text-xs uppercase opacity-80">
            {cart.count} {cart.count === 1 ? "item" : "itens"}
          </span>
          <span className="font-mono">{totalLabel}</span>
        </button>
      </div>

      {open && (
        <dialog
          ref={(element) => {
            if (element && !element.open) element.showModal();
          }}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
          aria-label="Sua sacola"
          className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-xl bg-(--c-bg) text-(--c-text) backdrop:bg-black/55 sm:m-auto sm:max-w-lg sm:rounded-xl"
        >
          <div className="flex items-center justify-between border-b border-(--c-text)/15 p-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Sacola{" "}
              <span className="font-mono text-sm font-normal opacity-60">· {cart.count}</span>
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex size-9 items-center justify-center rounded-md border border-(--c-text)/20"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <ul className="px-4">
            {cart.lines.map((line) => (
              <li
                key={line.key}
                className="flex items-center gap-3 border-b border-(--c-text)/12 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{line.name}</p>
                  {line.detail && <p className="text-xs opacity-70">{line.detail}</p>}
                  <p className="mt-0.5 font-mono text-[13px]">
                    {line.unitCents === null ? "SOB CONSULTA" : formatBRL(line.unitCents * line.qty)}
                  </p>
                </div>
                <QtyStepper qty={line.qty} min={0} onChange={(qty) => cart.setQty(line.key, qty)} />
              </li>
            ))}
          </ul>

          <div className="mx-4 flex items-baseline justify-between border-t border-(--c-text)/15 py-4">
            <span className={label}>Total</span>
            <span className="font-mono text-2xl tracking-tight">{totalLabel}</span>
          </div>

          <div className="space-y-4 px-4">
            <label className={label}>
              Seu nome (opcional)
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                maxLength={80}
                autoComplete="name"
                className={`${input} font-sans tracking-normal normal-case`}
              />
            </label>
            <label className={label}>
              Observações (opcional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                rows={2}
                className={`${input} font-sans tracking-normal normal-case`}
              />
            </label>
            {whatsapp && (
              <div>
                <p className={label}>Mensagem que será enviada</p>
                <pre className="mt-1.5 rounded-md border border-(--c-text)/15 bg-(--c-text)/[0.04] p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {buildOrderText(order).replaceAll("*", "")}
                </pre>
              </div>
            )}
          </div>

          <div className="space-y-2 p-4">
            {whatsapp ? (
              <a
                href={buildOrderLink({ ...order, whatsapp })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center rounded-md bg-success text-sm font-medium text-white"
              >
                Enviar pedido no WhatsApp
              </a>
            ) : (
              <p className="text-sm opacity-80">
                Este catálogo ainda não tem WhatsApp cadastrado para receber pedidos.
              </p>
            )}
            <p className="text-center text-xs opacity-70">
              Pagamento e entrega você combina direto com a loja.
            </p>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setOpen(false)} className="py-2 underline opacity-70">
                Continuar olhando
              </button>
              <button
                type="button"
                onClick={() => {
                  cart.clear();
                  setOpen(false);
                }}
                className="py-2 underline opacity-70"
              >
                Esvaziar sacola
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
