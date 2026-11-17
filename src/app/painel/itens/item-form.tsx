"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { centsToInput } from "@/lib/money";
import type { Category, Item, ItemType, ItemVariation } from "@/lib/types";
import { ui } from "@/lib/ui";
import { saveItem } from "../actions";

type VariationRow = { key: number; group_name: string; label: string; price: string };

export function ItemForm({
  item,
  variations,
  categories,
}: {
  item: Item | null;
  variations: ItemVariation[];
  categories: Category[];
}) {
  const [type, setType] = useState<ItemType>(item?.type ?? "product");
  const [onRequest, setOnRequest] = useState(item?.price_on_request ?? false);
  const [rows, setRows] = useState<VariationRow[]>(
    variations.map((v, index) => ({
      key: index,
      group_name: v.group_name,
      label: v.label,
      price: centsToInput(v.price_cents),
    })),
  );
  const [nextKey, setNextKey] = useState(variations.length);

  const updateRow = (key: number, patch: Partial<VariationRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <ActionForm action={saveItem} submitLabel={item ? "Salvar" : "Criar item"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <input
        type="hidden"
        name="variations"
        value={JSON.stringify(rows.map(({ group_name, label, price }) => ({ group_name, label, price })))}
      />

      <fieldset className="flex gap-4">
        <legend className={ui.label}>Tipo</legend>
        {(["product", "service"] as const).map((value) => (
          <label key={value} className="mt-1 flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="radio"
              name="type"
              value={value}
              checked={type === value}
              onChange={() => setType(value)}
              className="size-4"
            />
            {value === "product" ? "Produto" : "Serviço"}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="name" className={ui.label}>
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={item?.name ?? ""}
          className={ui.input}
        />
      </div>

      <div>
        <label htmlFor="description" className={ui.label}>
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={item?.description ?? ""}
          className={ui.input}
        />
      </div>

      <div>
        <label htmlFor="category_id" className={ui.label}>
          Categoria
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={item?.category_id ?? ""}
          className={ui.input}
        >
          <option value="">Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          name="price_on_request"
          checked={onRequest}
          onChange={(event) => setOnRequest(event.target.checked)}
          className="size-4"
        />
        Preço sob consulta
      </label>

      {!onRequest && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className={ui.label}>
                Preço (R$)
              </label>
              <input
                id="price"
                name="price"
                inputMode="decimal"
                placeholder="49,90"
                defaultValue={centsToInput(item?.price_cents ?? null)}
                className={ui.input}
              />
            </div>
            <div>
              <label htmlFor="promo_price" className={ui.label}>
                Preço promocional (R$)
              </label>
              <input
                id="promo_price"
                name="promo_price"
                inputMode="decimal"
                placeholder="Opcional"
                defaultValue={centsToInput(item?.promo_price_cents ?? null)}
                className={ui.input}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              name="price_is_from"
              defaultChecked={item?.price_is_from ?? false}
              className="size-4"
            />
            Mostrar como “a partir de”
          </label>
        </>
      )}

      {type === "service" && (
        <div>
          <label htmlFor="duration_minutes" className={ui.label}>
            Duração (minutos)
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Opcional"
            defaultValue={item?.duration_minutes ?? ""}
            className={ui.input}
          />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          name="available"
          defaultChecked={item?.available ?? true}
          className="size-4"
        />
        Disponível (desmarque para mostrar como esgotado)
      </label>

      <fieldset className="space-y-3">
        <legend className={ui.label}>Variações</legend>
        <p className={ui.hint}>
          Ex.: tipo “Tamanho”, opção “M”. O preço é opcional e substitui o do item.
        </p>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_7rem_auto]">
            <input
              aria-label="Tipo da variação"
              placeholder="Tipo (Tamanho)"
              maxLength={40}
              value={row.group_name}
              onChange={(event) => updateRow(row.key, { group_name: event.target.value })}
              className={ui.input}
            />
            <input
              aria-label="Opção da variação"
              placeholder="Opção (M)"
              maxLength={60}
              value={row.label}
              onChange={(event) => updateRow(row.key, { label: event.target.value })}
              className={ui.input}
            />
            <input
              aria-label="Preço da variação"
              placeholder="Preço"
              inputMode="decimal"
              value={row.price}
              onChange={(event) => updateRow(row.key, { price: event.target.value })}
              className={ui.input}
            />
            <button
              type="button"
              className={`${ui.buttonDanger} mt-1`}
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className={ui.buttonSecondary}
          onClick={() => {
            // Repete o tipo da linha anterior para agilizar o cadastro.
            const last = rows[rows.length - 1];
            setRows([...rows, { key: nextKey, group_name: last?.group_name ?? "", label: "", price: "" }]);
            setNextKey(nextKey + 1);
          }}
        >
          Adicionar variação
        </button>
      </fieldset>
    </ActionForm>
  );
}
