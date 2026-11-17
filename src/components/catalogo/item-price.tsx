import { formatBRL } from "@/lib/money";
import type { PublicItem } from "@/lib/public-catalog";

// Preço em fonte monoespaçada: os números alinham e leem melhor.
export function ItemPrice({ item, className = "" }: { item: PublicItem; className?: string }) {
  if (item.priceOnRequest || item.priceCents == null) {
    return <span className={`font-mono text-[0.85em] uppercase ${className}`}>Sob consulta</span>;
  }
  const hasPromo = item.promoPriceCents != null;
  return (
    <span className={`font-mono ${className}`}>
      {item.priceIsFrom && <span className="text-[0.75em] uppercase opacity-70">a partir de </span>}
      {formatBRL(item.promoPriceCents ?? item.priceCents)}
      {hasPromo && <s className="ml-1.5 text-[0.8em] opacity-60">{formatBRL(item.priceCents)}</s>}
    </span>
  );
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
