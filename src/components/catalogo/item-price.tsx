import { formatBRL } from "@/lib/money";
import type { PublicItem } from "@/lib/public-catalog";

export function ItemPrice({ item, className = "" }: { item: PublicItem; className?: string }) {
  if (item.priceOnRequest || item.priceCents == null) {
    return <span className={`font-semibold ${className}`}>Sob consulta</span>;
  }
  const hasPromo = item.promoPriceCents != null;
  return (
    <span className={`font-semibold ${className}`}>
      {item.priceIsFrom && <span className="font-normal opacity-70">a partir de </span>}
      {hasPromo && (
        <s className="mr-1.5 font-normal opacity-60">{formatBRL(item.priceCents)}</s>
      )}
      {formatBRL(item.promoPriceCents ?? item.priceCents)}
    </span>
  );
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
