"use client";

import { useSyncExternalStore } from "react";

export type CartLine = {
  /** itemId + variações escolhidas: a mesma combinação soma quantidade. */
  key: string;
  itemId: string;
  name: string;
  /** Variações escolhidas, ex.: "Tamanho: M, Cor: Azul". */
  detail: string;
  /** null = sob consulta. */
  unitCents: number | null;
  qty: number;
};

const EMPTY: CartLine[] = [];
const MAX_QTY = 99;
const MAX_LINES = 60;
const state = new Map<string, CartLine[]>();
const listeners = new Set<() => void>();
const storageKey = (slug: string) => `sacola:${slug}`;

function isLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.key === "string" &&
    typeof line.itemId === "string" &&
    typeof line.name === "string" &&
    typeof line.detail === "string" &&
    (line.unitCents === null || Number.isInteger(line.unitCents)) &&
    Number.isInteger(line.qty) &&
    (line.qty as number) >= 1 &&
    (line.qty as number) <= MAX_QTY
  );
}

function load(slug: string): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(slug)) ?? "[]");
    if (Array.isArray(parsed)) {
      const lines = parsed.filter(isLine).slice(0, MAX_LINES);
      return lines.length > 0 ? lines : EMPTY;
    }
  } catch {
    // Sem acesso ao armazenamento (ex.: navegação privada): a sacola vive só na memória.
  }
  return EMPTY;
}

function read(slug: string): CartLine[] {
  let lines = state.get(slug);
  if (!lines) {
    lines = load(slug);
    state.set(slug, lines);
  }
  return lines;
}

function write(slug: string, lines: CartLine[]) {
  state.set(slug, lines.length > 0 ? lines : EMPTY);
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(lines));
  } catch {
    // Ignora: continua funcionando em memória.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Mantém abas diferentes do mesmo catálogo em sincronia.
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("sacola:")) {
      state.delete(event.key.slice("sacola:".length));
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(slug: string) {
  const lines = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    totalCents: lines.reduce((sum, line) => sum + (line.unitCents ?? 0) * line.qty, 0),
    hasOnRequest: lines.some((line) => line.unitCents === null),
    add(line: CartLine) {
      const current = read(slug);
      const existing = current.find((l) => l.key === line.key);
      if (existing) {
        const qty = Math.min(MAX_QTY, existing.qty + line.qty);
        write(slug, current.map((l) => (l.key === line.key ? { ...line, qty } : l)));
      } else if (current.length < MAX_LINES) {
        write(slug, [...current, { ...line, qty: Math.min(MAX_QTY, line.qty) }]);
      }
    },
    setQty(key: string, qty: number) {
      const current = read(slug);
      write(
        slug,
        qty < 1
          ? current.filter((l) => l.key !== key)
          : current.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
      );
    },
    clear() {
      write(slug, []);
    },
  };
}
