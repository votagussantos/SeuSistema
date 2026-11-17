"use client";

import { createContext, use, useState, type ReactNode } from "react";

const SearchContext = createContext<{ query: string; setQuery: (query: string) => void }>({
  query: "",
  setQuery: () => {},
});

// Compara sem acentos e sem diferenciar maiúsculas.
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function useSearchMatch() {
  const query = normalize(use(SearchContext).query);
  return (name: string) => !query || normalize(name).includes(query);
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <SearchContext value={{ query, setQuery }}>{children}</SearchContext>;
}

export function SearchInput() {
  const { query, setQuery } = use(SearchContext);
  return (
    <input
      type="search"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder="Buscar"
      aria-label="Buscar no catálogo"
      enterKeyHint="search"
      className="h-10 w-full rounded-md border border-(--c-text)/15 bg-transparent px-3 text-base outline-none placeholder:text-(--c-text)/50 focus:border-(--c-primary)"
    />
  );
}

/** Esconde a seção inteira quando nenhum item dela combina com a busca. */
export function SearchSection({
  names,
  id,
  className,
  children,
}: {
  names: string[];
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const matches = useSearchMatch();
  return (
    <section id={id} className={className} hidden={!names.some(matches)}>
      {children}
    </section>
  );
}

export function SearchEmpty({ names }: { names: string[] }) {
  const matches = useSearchMatch();
  if (names.some(matches)) return null;
  return (
    <p role="status" className="py-10 text-center text-sm opacity-70">
      Nenhum item encontrado para essa busca.
    </p>
  );
}
