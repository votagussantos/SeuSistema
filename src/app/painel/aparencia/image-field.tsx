"use client";

import { ImageUploader } from "@/components/image-uploader";
import { setCatalogImage } from "../actions";

export function CatalogImageField({
  kind,
  catalogId,
  currentUrl,
}: {
  kind: "logo" | "cover";
  catalogId: string;
  currentUrl: string | null;
}) {
  const isLogo = kind === "logo";
  return (
    <div className="space-y-3">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={isLogo ? "Foto atual" : "Capa atual"}
          className={
            isLogo
              ? "size-24 rounded-full border border-zinc-200 object-cover"
              : "aspect-[3/1] w-full rounded-lg border border-zinc-200 object-cover"
          }
        />
      ) : (
        <p className="text-sm text-zinc-500">Nenhuma imagem enviada.</p>
      )}
      <ImageUploader
        folder={`${catalogId}/${kind}`}
        maxSide={isLogo ? 400 : 1600}
        label={currentUrl ? "Trocar imagem" : "Enviar imagem"}
        onUploaded={(path) => setCatalogImage(kind, path)}
      />
    </div>
  );
}
