"use client";

import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { ImageUploader } from "@/components/image-uploader";
import {
  centsToMoney,
  IntegerInput,
  MoneyInput,
  moneyToCents,
} from "@/components/masked-inputs";
import { Field, selectClass } from "@/components/painel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, mediaUrl } from "@/lib/supabase/env";
import type { Item, ItemPrivate, ItemType, ItemVariation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { saveItem } from "../../actions";

type VariationRow = { key: number; group_name: string; label: string; price: string };

const check = "size-4 accent-foreground";

export function ItemForm({
  item,
  internal,
  variations,
  categories,
  defaultType,
  noun,
  creation,
}: {
  item: Item | null;
  internal: ItemPrivate | null;
  variations: ItemVariation[];
  /** Já na ordem da árvore, com o caminho completo no rótulo. */
  categories: { id: string; label: string }[];
  defaultType: ItemType;
  /** Nome do item no segmento: "produto", "procedimento"… */
  noun: string;
  /** Só na criação: id reservado e dados para enviar fotos antes de salvar. */
  creation?: { newId: string; catalogId: string; maxImages: number };
}) {
  const [type, setType] = useState<ItemType>(item?.type ?? defaultType);
  const [onRequest, setOnRequest] = useState(item?.price_on_request ?? false);
  const [price, setPrice] = useState(centsToMoney(item?.price_cents));
  const [promo, setPromo] = useState(centsToMoney(item?.promo_price_cents));
  const [cost, setCost] = useState(centsToMoney(internal?.cost_cents));
  const [photos, setPhotos] = useState<string[]>([]);
  const [rows, setRows] = useState<VariationRow[]>(
    variations.map((v, index) => ({
      key: index,
      group_name: v.group_name,
      label: v.label,
      price: centsToMoney(v.price_cents),
    })),
  );
  const [nextKey, setNextKey] = useState(variations.length);

  const updateRow = (key: number, patch: Partial<VariationRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  // Margem calculada sobre o preço de venda efetivo (promocional, se houver).
  const sale = onRequest ? null : (moneyToCents(promo) ?? moneyToCents(price));
  const costCents = moneyToCents(cost);
  const profit = sale != null && costCents != null ? sale - costCents : null;
  const margin = profit != null && sale ? Math.round((profit / sale) * 100) : null;

  return (
    <ActionForm action={saveItem} submitLabel={item ? "Salvar" : `Criar ${noun}`}>
      {item && <input type="hidden" name="id" value={item.id} />}
      {creation && <input type="hidden" name="new_id" value={creation.newId} />}
      {creation && <input type="hidden" name="images" value={JSON.stringify(photos)} />}
      <input
        type="hidden"
        name="variations"
        value={JSON.stringify(rows.map(({ group_name, label, price }) => ({ group_name, label, price })))}
      />

      {creation && (
        <section className="grid gap-3">
          <div>
            <h3 className="text-sm font-medium">Fotos</h3>
            <p className="text-xs text-muted-foreground">
              Até {creation.maxImages}. A primeira é a principal.
            </p>
          </div>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((path, index) => (
                <li key={path} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(path)}
                    alt={`Foto ${index + 1}`}
                    className="aspect-square w-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute top-1 right-1"
                    onClick={() => {
                      setPhotos((current) => current.filter((p) => p !== path));
                      // Ainda não está ligada a nenhum item: apaga o arquivo.
                      void createClient().storage.from(MEDIA_BUCKET).remove([path]);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {photos.length < creation.maxImages && (
            <ImageUploader
              folder={`${creation.catalogId}/items/${creation.newId}`}
              maxSide={1200}
              label="Adicionar foto"
              onUploaded={async (path) => {
                setPhotos((current) => [...current, path]);
                return null;
              }}
            />
          )}
        </section>
      )}

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["product", "service"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium",
                type === value ? "border-foreground bg-muted" : "text-muted-foreground",
              )}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {value === "product" ? "Produto" : "Serviço"}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required maxLength={120} defaultValue={item?.name ?? ""} />
      </Field>

      <Field label="Descrição" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={item?.description ?? ""}
        />
      </Field>

      <Field label="Categoria" htmlFor="category_id">
        <select
          id="category_id"
          name="category_id"
          defaultValue={item?.category_id ?? ""}
          className={selectClass}
        >
          <option value="">Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="price_on_request"
          checked={onRequest}
          onChange={(event) => setOnRequest(event.target.checked)}
          className={check}
        />
        Preço sob consulta
      </label>

      {!onRequest && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço" htmlFor="price">
              <MoneyInput
                id="price"
                name="price"
                placeholder="0,00"
                value={price}
                onValueChange={setPrice}
              />
            </Field>
            <Field label="Preço promocional" htmlFor="promo_price" hint="Opcional. Aparece riscando o preço.">
              <MoneyInput
                id="promo_price"
                name="promo_price"
                placeholder="0,00"
                value={promo}
                onValueChange={setPromo}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="price_is_from"
              defaultChecked={item?.price_is_from ?? false}
              className={check}
            />
            Mostrar como “a partir de”
          </label>
        </>
      )}

      {type === "service" && (
        <Field label="Duração (minutos)" htmlFor="duration_minutes">
          <IntegerInput
            id="duration_minutes"
            name="duration_minutes"
            maxDigits={5}
            placeholder="Opcional"
            defaultValue={item?.duration_minutes?.toString() ?? ""}
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="available"
          defaultChecked={item?.available ?? true}
          className={check}
        />
        Disponível (desmarque para mostrar como esgotado)
      </label>

      <fieldset className="grid gap-4 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Gestão (só você vê)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Custo" htmlFor="cost" hint="Quanto você gasta para ter este item.">
            <MoneyInput id="cost" name="cost" placeholder="0,00" value={cost} onValueChange={setCost} />
          </Field>
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-medium">Margem</span>
            <p
              aria-live="polite"
              className={cn(
                "flex h-10 items-center rounded-lg bg-muted px-3 text-sm",
                margin != null && margin < 0 && "text-destructive",
              )}
            >
              {margin == null
                ? "Informe preço e custo"
                : `${margin}% · ${formatBRL(profit!)} por venda`}
            </p>
          </div>
          <Field label="Estoque atual" htmlFor="stock_quantity" hint="Deixe vazio se não controla estoque.">
            <IntegerInput
              id="stock_quantity"
              name="stock_quantity"
              placeholder="Não controlo"
              defaultValue={internal?.stock_quantity?.toString() ?? ""}
            />
          </Field>
          <Field label="Estoque mínimo" htmlFor="stock_min" hint="Abaixo disso, avisamos no início do painel.">
            <IntegerInput
              id="stock_min"
              name="stock_min"
              placeholder="Ex.: 5"
              defaultValue={internal?.stock_min?.toString() ?? ""}
            />
          </Field>
        </div>
        <Field
          label="Curva ABC"
          htmlFor="abc_class"
          hint="A: os que mais vendem ou dão lucro. B: intermediários. C: pouco relevantes."
        >
          <select
            id="abc_class"
            name="abc_class"
            defaultValue={internal?.abc_class ?? ""}
            className={selectClass}
          >
            <option value="">Não classificado</option>
            <option value="A">A — mais importantes</option>
            <option value="B">B — intermediários</option>
            <option value="C">C — menos importantes</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Variações</legend>
        <p className="text-xs text-muted-foreground">
          Ex.: tipo “Tamanho”, opção “M”. O preço é opcional e substitui o do item.
        </p>
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[1fr_1fr] gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
            <div className="grid gap-1">
              {index === 0 && <Label className="text-xs text-muted-foreground">Tipo</Label>}
              <Input
                aria-label="Tipo da variação"
                placeholder="Tamanho"
                maxLength={40}
                value={row.group_name}
                onChange={(event) => updateRow(row.key, { group_name: event.target.value })}
              />
            </div>
            <div className="grid gap-1">
              {index === 0 && <Label className="text-xs text-muted-foreground">Opção</Label>}
              <Input
                aria-label="Opção da variação"
                placeholder="M"
                maxLength={60}
                value={row.label}
                onChange={(event) => updateRow(row.key, { label: event.target.value })}
              />
            </div>
            <div className="grid gap-1">
              {index === 0 && <Label className="text-xs text-muted-foreground">Preço</Label>}
              <MoneyInput
                aria-label="Preço da variação"
                placeholder="Opcional"
                value={row.price}
                onValueChange={(value) => updateRow(row.key, { price: value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remover variação ${row.label || index + 1}`}
              className="self-end"
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Repete o tipo da linha anterior para agilizar o cadastro.
              const last = rows[rows.length - 1];
              setRows([
                ...rows,
                { key: nextKey, group_name: last?.group_name ?? "", label: "", price: "" },
              ]);
              setNextKey(nextKey + 1);
            }}
          >
            <PlusIcon />
            Adicionar variação
          </Button>
        </div>
      </fieldset>
    </ActionForm>
  );
}
