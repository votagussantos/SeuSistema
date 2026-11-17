"use client";

import { ImageUploader } from "@/components/image-uploader";
import { setCatalogImage } from "../../actions";

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
    <div className="grid gap-3">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={isLogo ? "Foto atual" : "Capa atual"}
          className={
            isLogo
              ? "size-24 rounded-full border object-cover"
              : "aspect-[3/1] w-full rounded-lg border object-cover"
          }
        />
      ) : (
        <div
          className={
            isLogo
              ? "size-24 rounded-full border border-dashed bg-muted"
              : "aspect-[3/1] w-full rounded-lg border border-dashed bg-muted"
          }
        />
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
