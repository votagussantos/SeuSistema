import type { CatalogLayout } from "./types";

export type Preset = {
  id: string;
  name: string;
  hint: string;
  layout: CatalogLayout;
  primary: string;
  background: string;
  text: string;
};

// Combinações prontas de layout e cores. Todas com contraste de leitura adequado.
export const presets: Preset[] = [
  { id: "classico", name: "Clássico", hint: "Loja em geral", layout: "grade", primary: "#111827", background: "#ffffff", text: "#111827" },
  { id: "boutique", name: "Boutique", hint: "Moda e acessórios", layout: "destaque", primary: "#9d174d", background: "#fff7f9", text: "#1f2937" },
  { id: "cardapio", name: "Cardápio", hint: "Comida e bebida", layout: "lista", primary: "#b45309", background: "#fffbeb", text: "#292524" },
  { id: "natural", name: "Natural", hint: "Artesanato e naturais", layout: "grade", primary: "#166534", background: "#f7fbf2", text: "#1c1917" },
  { id: "estudio", name: "Estúdio", hint: "Beleza e serviços", layout: "lista", primary: "#6d28d9", background: "#faf7ff", text: "#1e1b4b" },
  { id: "oceano", name: "Oceano", hint: "Serviços em geral", layout: "destaque", primary: "#0369a1", background: "#f3f9fd", text: "#0c4a6e" },
  { id: "noite", name: "Noite", hint: "Visual escuro", layout: "grade", primary: "#facc15", background: "#0b0b0f", text: "#f4f4f5" },
  { id: "doce", name: "Doce", hint: "Confeitaria e festas", layout: "grade", primary: "#db2777", background: "#fff5f7", text: "#3b0a1e" },
];

export const layoutOptions: { value: CatalogLayout; name: string; hint: string }[] = [
  { value: "grade", name: "Grade", hint: "Vitrine em colunas. Bom para muitos produtos." },
  { value: "lista", name: "Lista", hint: "Estilo cardápio. Bom para serviços e comida." },
  { value: "destaque", name: "Destaque", hint: "Fotos grandes. Bom para poucos itens." },
];
