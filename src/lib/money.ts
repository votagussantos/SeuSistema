const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}

// "1.234,56" -> 123456. Retorna null para vazio e NaN para inválido.
export function parseBRL(input: string): number | null {
  const text = input.replace(/[R$\s]/g, "");
  if (!text) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(text)) return NaN;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  return Math.round(parseFloat(normalized) * 100);
}

// Para preencher campos de formulário: 123456 -> "1234,56"
export function centsToInput(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}
