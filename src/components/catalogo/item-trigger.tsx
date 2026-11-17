"use client";

import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
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
      className="mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-(--c-bg) text-(--c-text) backdrop:bg-black/50 sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      {item.images.length > 0 && (
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {item.images.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={index === 0 ? item.name : `${item.name}, foto ${index + 1}`}
              className="aspect-square w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
      )}

      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <p className="mt-1 text-base">
            <ItemPrice item={item} />
            {item.durationMinutes != null && (
              <span className="opacity-70"> · {durationLabel(item.durationMinutes)}</span>
            )}
          </p>
        </div>

        {item.description && (
          <p className="text-sm whitespace-pre-line opacity-80">{item.description}</p>
        )}

        {item.variations.map((group) => (
          <fieldset key={group.name}>
            <legend className="text-sm font-medium">{group.name}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.options.map((option) => (
                <label
                  key={option.label}
                  className="cursor-pointer rounded-full border border-(--c-text)/25 px-3 py-1.5 text-sm has-checked:border-(--c-primary) has-checked:bg-(--c-primary) has-checked:text-(--c-on-primary)"
                >
                  <input
                    type="radio"
                    name={`variacao-${group.name}`}
                    className="sr-only"
                    checked={choices[group.name] === option.label}
                    onChange={() => setChoices({ ...choices, [group.name]: option.label })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {item.available ? (
          <div className="flex items-center gap-3">
            <QtyStepper qty={qty} onChange={setQty} min={1} />
            <button
              type="button"
              disabled={Boolean(missing)}
              onClick={add}
              className="flex-1 rounded-full bg-(--c-primary) px-4 py-3 text-sm font-semibold text-(--c-on-primary) disabled:opacity-50"
            >
              {missing ? `Escolha: ${missing.name}` : "Adicionar à sacola"}
            </button>
          </div>
        ) : (
          <p className="rounded-lg border border-(--c-text)/20 px-4 py-3 text-center text-sm font-medium">
            Esgotado no momento
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-sm underline opacity-70"
        >
          Fechar
        </button>
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
    "flex size-10 items-center justify-center text-lg disabled:opacity-30";
  return (
    <div className="flex items-center rounded-full border border-(--c-text)/25">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={qty <= min}
        onClick={() => onChange(qty - 1)}
        className={button}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-medium">
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
