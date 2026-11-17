"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { buildOrderLink } from "@/lib/whatsapp";
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
      ? `${formatBRL(cart.totalCents)}${cart.hasOnRequest ? " + sob consulta" : ""}`
      : "Sob consulta";
  const input =
    "mt-1 block w-full rounded-lg border border-(--c-text)/25 bg-transparent px-3 py-2 text-base outline-none focus:border-(--c-primary)";

  return (
    <>
      {/* Espaço para a barra fixa não cobrir o fim da página. */}
      <div className="h-20" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-10 p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex w-full max-w-lg items-center justify-between rounded-full bg-(--c-primary) px-5 py-3.5 text-sm font-semibold text-(--c-on-primary) shadow-lg"
        >
          <span>
            Ver sacola ({cart.count} {cart.count === 1 ? "item" : "itens"})
          </span>
          <span>{totalLabel}</span>
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
          className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-(--c-bg) text-(--c-text) backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-2xl"
        >
          <div className="space-y-5 p-5">
            <h2 className="text-lg font-semibold">Sua sacola</h2>

            <ul className="divide-y divide-(--c-text)/15">
              {cart.lines.map((line) => (
                <li key={line.key} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{line.name}</p>
                    {line.detail && <p className="text-xs opacity-70">{line.detail}</p>}
                    <p className="mt-0.5 text-sm">
                      {line.unitCents === null
                        ? "Sob consulta"
                        : formatBRL(line.unitCents * line.qty)}
                    </p>
                  </div>
                  <QtyStepper
                    qty={line.qty}
                    min={0}
                    onChange={(qty) => cart.setQty(line.key, qty)}
                  />
                </li>
              ))}
            </ul>

            <p className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{totalLabel}</span>
            </p>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Seu nome (opcional)
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  className={input}
                />
              </label>
              <label className="block text-sm font-medium">
                Observações (opcional)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  rows={2}
                  className={input}
                />
              </label>
            </div>

            {whatsapp ? (
              <a
                href={buildOrderLink({
                  whatsapp,
                  catalogName,
                  lines: cart.lines,
                  customerName,
                  notes,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full bg-(--c-primary) px-4 py-3.5 text-center text-sm font-semibold text-(--c-on-primary)"
              >
                Enviar pedido pelo WhatsApp
              </a>
            ) : (
              <p className="text-sm opacity-80">
                Este catálogo ainda não tem WhatsApp cadastrado para receber pedidos.
              </p>
            )}
            <p className="text-center text-xs opacity-70">
              O pedido é combinado direto com o vendedor. Nenhum pagamento é feito por aqui.
            </p>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="py-2 underline opacity-70"
              >
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
