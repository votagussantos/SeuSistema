import type { ItemType } from "./types";

// Segmentos do onboarding. Cada um ajusta os nomes usados no painel, o tipo padrão
// de item, o modelo visual sugerido e as sugestões de categorias e itens.

export type SuggestedItem = {
  name: string;
  /** Caminho da categoria, do nível principal ao último. */
  category: string[];
  type?: ItemType;
  durationMinutes?: number;
};

export type Segment = {
  id: string;
  group: "produtos" | "servicos" | "outro";
  name: string;
  hint: string;
  /** Como os itens são chamados no painel. */
  noun: { singular: string; plural: string; feminine: boolean };
  itemType: ItemType;
  presetId: string;
  categories: string[][];
  items: SuggestedItem[];
};

const product = { singular: "produto", plural: "produtos", feminine: false };
const service = { singular: "serviço", plural: "serviços", feminine: false };

export const segments: Segment[] = [
  {
    id: "restaurante",
    group: "produtos",
    name: "Restaurante e lanchonete",
    hint: "Cardápio, marmitas, delivery",
    noun: product,
    itemType: "product",
    presetId: "cardapio",
    categories: [
      ["Pratos"],
      ["Lanches"],
      ["Porções"],
      ["Bebidas", "Refrigerantes"],
      ["Bebidas", "Sucos"],
      ["Bebidas", "Águas"],
      ["Sobremesas"],
    ],
    items: [
      { name: "Prato feito", category: ["Pratos"] },
      { name: "Marmitex", category: ["Pratos"] },
      { name: "X-Burguer", category: ["Lanches"] },
      { name: "X-Salada", category: ["Lanches"] },
      { name: "Porção de batata frita", category: ["Porções"] },
      { name: "Refrigerante lata", category: ["Bebidas", "Refrigerantes"] },
      { name: "Refrigerante 2 litros", category: ["Bebidas", "Refrigerantes"] },
      { name: "Suco natural", category: ["Bebidas", "Sucos"] },
      { name: "Água mineral", category: ["Bebidas", "Águas"] },
      { name: "Pudim", category: ["Sobremesas"] },
    ],
  },
  {
    id: "confeitaria",
    group: "produtos",
    name: "Doces e confeitaria",
    hint: "Bolos, doces, salgados para festa",
    noun: product,
    itemType: "product",
    presetId: "doce",
    categories: [["Bolos"], ["Doces"], ["Salgados"], ["Kits para festa"]],
    items: [
      { name: "Bolo de pote", category: ["Bolos"] },
      { name: "Bolo de aniversário", category: ["Bolos"] },
      { name: "Brigadeiro gourmet", category: ["Doces"] },
      { name: "Brownie", category: ["Doces"] },
      { name: "Cento de salgados", category: ["Salgados"] },
      { name: "Kit festa", category: ["Kits para festa"] },
    ],
  },
  {
    id: "moda",
    group: "produtos",
    name: "Moda e acessórios",
    hint: "Roupas, calçados, bolsas, bijuterias",
    noun: product,
    itemType: "product",
    presetId: "boutique",
    categories: [
      ["Feminino", "Blusas"],
      ["Feminino", "Calças e saias"],
      ["Feminino", "Vestidos"],
      ["Masculino", "Camisetas"],
      ["Masculino", "Calças e bermudas"],
      ["Acessórios"],
    ],
    items: [
      { name: "Blusa básica", category: ["Feminino", "Blusas"] },
      { name: "Calça jeans", category: ["Feminino", "Calças e saias"] },
      { name: "Vestido", category: ["Feminino", "Vestidos"] },
      { name: "Camiseta básica", category: ["Masculino", "Camisetas"] },
      { name: "Bermuda", category: ["Masculino", "Calças e bermudas"] },
      { name: "Bolsa", category: ["Acessórios"] },
    ],
  },
  {
    id: "artesanato",
    group: "produtos",
    name: "Artesanato e presentes",
    hint: "Personalizados, decoração, lembrancinhas",
    noun: product,
    itemType: "product",
    presetId: "natural",
    categories: [["Personalizados"], ["Decoração"], ["Presentes"], ["Lembrancinhas"]],
    items: [
      { name: "Caneca personalizada", category: ["Personalizados"] },
      { name: "Chaveiro personalizado", category: ["Personalizados"] },
      { name: "Quadro decorativo", category: ["Decoração"] },
      { name: "Vela aromática", category: ["Decoração"] },
      { name: "Cesta de presente", category: ["Presentes"] },
    ],
  },
  {
    id: "mercado",
    group: "produtos",
    name: "Mercearia e hortifruti",
    hint: "Mercadinho, feira, empório",
    noun: product,
    itemType: "product",
    presetId: "classico",
    categories: [
      ["Hortifruti", "Frutas"],
      ["Hortifruti", "Verduras e legumes"],
      ["Mercearia"],
      ["Bebidas"],
      ["Limpeza"],
    ],
    items: [
      { name: "Banana (kg)", category: ["Hortifruti", "Frutas"] },
      { name: "Tomate (kg)", category: ["Hortifruti", "Verduras e legumes"] },
      { name: "Ovos (dúzia)", category: ["Mercearia"] },
      { name: "Arroz 5 kg", category: ["Mercearia"] },
      { name: "Feijão 1 kg", category: ["Mercearia"] },
    ],
  },
  {
    id: "estetica",
    group: "servicos",
    name: "Estética e beleza",
    hint: "Massagens, procedimentos, unhas, sobrancelhas",
    noun: { singular: "procedimento", plural: "procedimentos", feminine: false },
    itemType: "service",
    presetId: "estudio",
    categories: [
      ["Massagens"],
      ["Estética facial"],
      ["Estética corporal"],
      ["Unhas"],
      ["Sobrancelhas e cílios"],
      ["Depilação"],
    ],
    items: [
      { name: "Massagem relaxante", category: ["Massagens"], durationMinutes: 60 },
      { name: "Drenagem linfática", category: ["Massagens"], durationMinutes: 60 },
      { name: "Limpeza de pele", category: ["Estética facial"], durationMinutes: 60 },
      { name: "Aplicação de botox", category: ["Estética facial"], durationMinutes: 30 },
      { name: "Massagem modeladora", category: ["Estética corporal"], durationMinutes: 50 },
      { name: "Manicure", category: ["Unhas"], durationMinutes: 45 },
      { name: "Pedicure", category: ["Unhas"], durationMinutes: 45 },
      { name: "Design de sobrancelhas", category: ["Sobrancelhas e cílios"], durationMinutes: 30 },
      { name: "Depilação", category: ["Depilação"], durationMinutes: 30 },
    ],
  },
  {
    id: "cabelo",
    group: "servicos",
    name: "Salão e barbearia",
    hint: "Cortes, barba, coloração, tratamentos",
    noun: service,
    itemType: "service",
    presetId: "noite",
    categories: [["Cortes"], ["Barba"], ["Coloração"], ["Tratamentos"]],
    items: [
      { name: "Corte masculino", category: ["Cortes"], durationMinutes: 30 },
      { name: "Corte feminino", category: ["Cortes"], durationMinutes: 60 },
      { name: "Barba", category: ["Barba"], durationMinutes: 30 },
      { name: "Corte e barba", category: ["Barba"], durationMinutes: 60 },
      { name: "Coloração", category: ["Coloração"], durationMinutes: 120 },
      { name: "Hidratação", category: ["Tratamentos"], durationMinutes: 45 },
      { name: "Escova", category: ["Tratamentos"], durationMinutes: 45 },
    ],
  },
  {
    id: "saude",
    group: "servicos",
    name: "Saúde e bem-estar",
    hint: "Consultas, terapias, treinos",
    noun: service,
    itemType: "service",
    presetId: "oceano",
    categories: [["Consultas"], ["Terapias"], ["Treinos e aulas"]],
    items: [
      { name: "Consulta", category: ["Consultas"], durationMinutes: 50 },
      { name: "Sessão de fisioterapia", category: ["Terapias"], durationMinutes: 50 },
      { name: "Sessão de terapia", category: ["Terapias"], durationMinutes: 50 },
      { name: "Aula de pilates", category: ["Treinos e aulas"], durationMinutes: 60 },
      { name: "Personal trainer", category: ["Treinos e aulas"], durationMinutes: 60 },
    ],
  },
  {
    id: "reparos",
    group: "servicos",
    name: "Reformas e manutenção",
    hint: "Elétrica, hidráulica, pintura, montagem",
    noun: service,
    itemType: "service",
    presetId: "oceano",
    categories: [["Elétrica"], ["Hidráulica"], ["Pintura"], ["Montagem e instalação"]],
    items: [
      { name: "Visita técnica", category: ["Elétrica"] },
      { name: "Troca de tomada ou interruptor", category: ["Elétrica"] },
      { name: "Instalação de chuveiro", category: ["Hidráulica"] },
      { name: "Conserto de vazamento", category: ["Hidráulica"] },
      { name: "Pintura de cômodo", category: ["Pintura"] },
      { name: "Montagem de móveis", category: ["Montagem e instalação"] },
    ],
  },
  {
    id: "aulas",
    group: "servicos",
    name: "Aulas e cursos",
    hint: "Reforço escolar, idiomas, música",
    noun: { singular: "aula", plural: "aulas", feminine: true },
    itemType: "service",
    presetId: "classico",
    categories: [["Reforço escolar"], ["Idiomas"], ["Música"]],
    items: [
      { name: "Aula de reforço", category: ["Reforço escolar"], durationMinutes: 60 },
      { name: "Aula de inglês", category: ["Idiomas"], durationMinutes: 60 },
      { name: "Aula de violão", category: ["Música"], durationMinutes: 60 },
    ],
  },
  {
    id: "outro",
    group: "outro",
    name: "Outro segmento",
    hint: "Monte do seu jeito, sem sugestões",
    noun: { singular: "item", plural: "itens", feminine: false },
    itemType: "product",
    presetId: "classico",
    categories: [],
    items: [],
  },
];

const fallback = segments[segments.length - 1];

export function getSegment(id: string | null | undefined): Segment {
  return segments.find((segment) => segment.id === id) ?? fallback;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Textos do painel conforme o segmento: "Produtos", "Novo produto", "Nova aula"… */
export function nounsFor(segmentId: string | null | undefined) {
  const { noun } = getSegment(segmentId);
  return {
    singular: noun.singular,
    plural: noun.plural,
    Plural: capitalize(noun.plural),
    novo: `${noun.feminine ? "Nova" : "Novo"} ${noun.singular}`,
    nenhum: `${noun.feminine ? "Nenhuma" : "Nenhum"} ${noun.singular}`,
    primeiro: `${noun.feminine ? "sua primeira" : "seu primeiro"} ${noun.singular}`,
  };
}
