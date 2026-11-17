// Árvore de categorias (até 5 níveis) achatada na ordem de exibição.

export const MAX_CATEGORY_DEPTH = 5;

export type FlatCategory<T> = T & {
  /** 1 = categoria principal. */
  depth: number;
  /** Nomes dos ancestrais, do principal ao pai direto. */
  ancestors: string[];
  /** Id da categoria principal desta ramificação. */
  rootId: string;
  /** Posição entre as irmãs e total de irmãs (para os botões de ordem). */
  index: number;
  siblings: number;
};

type Node = { id: string; parent_id: string | null; name: string };

export function flattenCategories<T extends Node>(categories: T[]): FlatCategory<T>[] {
  const children = new Map<string | null, T[]>();
  const ids = new Set(categories.map((c) => c.id));
  for (const category of categories) {
    // Pai inexistente (não deveria ocorrer): trata como principal.
    const parent = category.parent_id && ids.has(category.parent_id) ? category.parent_id : null;
    const list = children.get(parent) ?? [];
    list.push(category);
    children.set(parent, list);
  }

  const result: FlatCategory<T>[] = [];
  const visit = (parent: string | null, depth: number, ancestors: string[], rootId: string | null) => {
    if (depth > MAX_CATEGORY_DEPTH) return;
    const list = children.get(parent) ?? [];
    list.forEach((category, index) => {
      const root = rootId ?? category.id;
      result.push({ ...category, depth, ancestors, rootId: root, index, siblings: list.length });
      visit(category.id, depth + 1, [...ancestors, category.name], root);
    });
  };
  visit(null, 1, [], null);
  return result;
}

export function categoryPath(category: { ancestors: string[]; name: string }) {
  return [...category.ancestors, category.name].join(" › ");
}
