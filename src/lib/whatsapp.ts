import type { CartLine } from "./cart";
import { formatBRL } from "./money";

// Monta o link do pedido. O número vem validado do banco (só dígitos).
export function buildOrderLink(input: {
  whatsapp: string;
  catalogName: string;
  lines: CartLine[];
  customerName: string;
  notes: string;
}) {
  const { lines } = input;
  const total = lines.reduce((sum, line) => sum + (line.unitCents ?? 0) * line.qty, 0);
  const hasOnRequest = lines.some((line) => line.unitCents === null);
  const allOnRequest = lines.every((line) => line.unitCents === null);

  const rows = lines.map((line) => {
    const detail = line.detail ? ` (${line.detail})` : "";
    const price =
      line.unitCents === null ? "sob consulta" : formatBRL(line.unitCents * line.qty);
    return `• ${line.qty}x ${line.name}${detail} — ${price}`;
  });

  const parts = [`Olá! Vim pelo catálogo *${input.catalogName}* e gostaria de pedir:`, "", ...rows];
  if (!allOnRequest) {
    parts.push("", `*Total: ${formatBRL(total)}*${hasOnRequest ? " + itens sob consulta" : ""}`);
  }
  const name = input.customerName.trim();
  const notes = input.notes.trim();
  if (name || notes) parts.push("");
  if (name) parts.push(`Nome: ${name}`);
  if (notes) parts.push(`Observações: ${notes}`);

  return `https://wa.me/${input.whatsapp}?text=${encodeURIComponent(parts.join("\n"))}`;
}
