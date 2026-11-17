"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Endereço do catálogo com copiar e enviar pelo WhatsApp.
export function ShareLink({ path, published }: { path: string; published: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-1.5 pl-3">
      <span className="min-w-0 flex-1 truncate font-mono text-[13px]">seusistema.app{path}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Sem permissão de área de transferência: o endereço continua visível.
          }
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
      {published && (
        <Button
          type="button"
          size="sm"
          className="bg-success text-white hover:bg-success/90"
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(`Veja meu catálogo: ${url()}`)}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          WhatsApp
        </Button>
      )}
    </div>
  );
}
