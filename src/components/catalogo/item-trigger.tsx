"use client";

import { XIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import type { PublicItem } from "@/lib/public-catalog";
import { durationLabel, ItemPrice } from "./item-price";
import { useSearchMatch } from "./search";

// Item da lista: o cartão vem pronto do servidor; aqui ficam o toque, a busca e os detalhes.
export function ItemTrigger({
  slug,
  item,
  className,
  itemClassName,
  children,
}: {
  slug: string;
  item: PublicItem;
  /** Classes do botão que envolve o cartão. */
  className?: string;
  /** Classes do <li>. */
  itemClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const matches = useSearchMatch();
  return (
    <li className={itemClassName} hidden={!matches(item.name)}>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <ItemDialog slug={slug} item={item} onClose={() => setOpen(false)} />}
    </li>
  );
}

function ItemDialog({
  slug,
  item,
  onClose,
}: {
  slug: string;
  item: PublicItem;
  onClose: () => void;
}) {
  const cart = useCart(slug);
  const [qty, setQty] = useState(1);
  const [choices, setChoices] = useState<Record<string, string>>({});

  const missing = item.variations.find((group) => !choices[group.name]);
  const chosen = item.variations
    .map((group) => ({
      group: group.name,
      option: group.options.find((o) => o.label === choices[group.name]),
    }))
    .filter((c) => c.option);

  // Preço da variação substitui o do item; com mais de uma, vale o maior.
  const variationPrices = chosen
    .map((c) => c.option!.priceCents)
    .filter((p): p is number => p != null);
  const unitCents = item.priceOnRequest
    ? null
    : variationPrices.length > 0
      ? Math.max(...variationPrices)
      : (item.promoPriceCents ?? item.priceCents);

  function add() {
    const detail = chosen.map((c) => `${c.group}: ${c.option!.label}`).join(", ");
    cart.add({
      key: `${item.id}|${detail}`,
      itemId: item.id,
      name: item.name,
      detail,
      unitCents,
      qty,
    });
    onClose();
  }

  return (
    <dialog
      ref={(element) => {
        if (element && !element.open) element.showModal();
      }}
      onClose={onClose}
      onClick={(event) => {
        // Toque fora do conteúdo fecha.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      aria-label={item.name}
      className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-xl bg-(--c-bg) text-(--c-text) backdrop:bg-black/55 sm:m-auto sm:max-w-lg sm:rounded-xl"
    >
      <div className="relative">
        {item.images.length > 0 && (
          <div className="flex snap-x snap-mandatory overflow-x-auto">
            {item.images.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={index === 0 ? item.name : `${item.name}, foto ${index + 1}`}
                className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-md bg-white text-neutral-900 shadow-sm"
        >
          <XIcon className="size-4" />
        </button>
        {item.images.length > 1 && (
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-white">
            1 / {item.images.length}
          </span>
        )}
      </div>

      <div className="space-y-5 p-4 pt-5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{item.name}</h2>
            <ItemPrice item={item} className="shrink-0 text-base" />
          </div>
          {item.durationMinutes != null && (
            <p className="font-mono text-xs uppercase opacity-70">{durationLabel(item.durationMinutes)}</p>
          )}
          {item.description && (
            <p className="text-sm whitespace-pre-line opacity-80">{item.description}</p>
          )}
        </div>

        {item.variations.map((group) => (
          <fieldset key={group.name}>
            <legend className="mb-2 font-mono text-[11px] tracking-[0.08em] uppercase opacity-70">
              {group.name} · escolha 1
            </legend>
            <div className="overflow-hidden rounded-lg border border-(--c-text)/15">
              {group.options.map((option) => {
                const checked = choices[group.name] === option.label;
                return (
                  <label
                    key={option.label}
                    className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-(--c-text)/15 px-3.5 text-sm last:border-b-0"
                    style={checked ? { boxShadow: "inset 2px 0 0 var(--c-primary)" } : undefined}
                  >
                    <input
                      type="radio"
                      name={`variacao-${group.name}`}
                      checked={checked}
                      onChange={() => setChoices({ ...choices, [group.name]: option.label })}
                      className="size-4"
                      style={{ accentColor: "var(--c-primary)" }}
                    />
                    <span className={`flex-1 ${checked ? "font-medium" : ""}`}>{option.label}</span>
                    {option.priceCents != null && (
                      <span className="font-mono text-[13px] opacity-70">{formatBRL(option.priceCents)}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-0 flex items-center gap-2.5 border-t border-(--c-text)/15 bg-(--c-bg) p-4">
        {item.available ? (
          <>
            <QtyStepper qty={qty} onChange={setQty} min={1} />
            <button
              type="button"
              disabled={Boolean(missing)}
              onClick={add}
              className="flex h-12 flex-1 items-center justify-between gap-3 rounded-md bg-(--c-primary) px-4 text-sm font-medium text-(--c-on-primary) disabled:opacity-50"
            >
              <span>{missing ? `Escolha: ${missing.name}` : "Adicionar"}</span>
              {!missing && unitCents != null && (
                <span className="font-mono">{formatBRL(unitCents * qty)}</span>
              )}
            </button>
          </>
        ) : (
          <p className="w-full rounded-md border border-(--c-text)/20 px-4 py-3 text-center font-mono text-xs uppercase">
            Esgotado no momento
          </p>
        )}
      </div>
    </dialog>
  );
}

export function QtyStepper({
  qty,
  onChange,
  min,
}: {
  qty: number;
  onChange: (qty: number) => void;
  min: number;
}) {
  const button =
    "flex h-full w-11 items-center justify-center text-lg disabled:opacity-30";
  return (
    <div className="flex h-12 items-center rounded-md border border-(--c-text)/20">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={qty <= min}
        onClick={() => onChange(qty - 1)}
        className={button}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-6 text-center font-mono text-sm">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={qty >= 99}
        onClick={() => onChange(qty + 1)}
        className={button}
      >
        +
      </button>
    </div>
  );
}
