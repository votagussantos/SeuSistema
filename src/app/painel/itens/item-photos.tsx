"use client";

import { ImageUploader } from "@/components/image-uploader";
import { ui } from "@/lib/ui";
import { addItemImage, deleteItemImage } from "../actions";

export function ItemPhotos({
  catalogId,
  itemId,
  images,
  max,
}: {
  catalogId: string;
  itemId: string;
  images: { id: string; url: string }[];
  max: number;
}) {
  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {images.map((image) => (
            <li key={image.id} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Foto do item"
                className="aspect-square w-full rounded-lg border border-zinc-200 object-cover"
              />
              <form action={deleteItemImage}>
                <input type="hidden" name="id" value={image.id} />
                <button type="submit" className={`${ui.buttonDanger} w-full`}>
                  Excluir
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {images.length < max ? (
        <ImageUploader
          folder={`${catalogId}/items/${itemId}`}
          maxSide={1200}
          label="Adicionar foto"
          onUploaded={(path) => addItemImage(itemId, path)}
        />
      ) : (
        <p className="text-sm text-zinc-600">
          Limite de {max} fotos por item atingido no seu plano.
        </p>
      )}
    </div>
  );
}
