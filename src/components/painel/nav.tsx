"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PainelNav({ itemsLabel = "Itens" }: { itemsLabel?: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/painel", label: "Início" },
    { href: "/painel/itens", label: itemsLabel },
    { href: "/painel/categorias", label: "Categorias" },
    { href: "/painel/aparencia", label: "Aparência" },
  ];
  return (
    <nav aria-label="Painel" className="-mb-px flex gap-5 overflow-x-auto">
      {links.map((link) => {
        const active =
          link.href === "/painel" ? pathname === "/painel" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 py-3 text-sm transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
