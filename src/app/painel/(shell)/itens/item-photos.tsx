"use client";

import { Trash2Icon } from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { addItemImage, deleteItemImage } from "../../actions";

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
    <div className="grid gap-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Foto ${index + 1} do item`}
                className="aspect-square w-full rounded-lg border object-cover"
              />
              <form action={deleteItemImage} className="absolute top-1 right-1">
                <input type="hidden" name="id" value={image.id} />
                <Button
                  type="submit"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Excluir foto ${index + 1}`}
                >
                  <Trash2Icon />
                </Button>
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
        <p className="text-sm text-muted-foreground">
          Limite de {max} fotos por item atingido no seu plano.
        </p>
      )}
    </div>
  );
}
