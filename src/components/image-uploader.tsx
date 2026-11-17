"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import type { ActionState } from "@/lib/types";
import { ui } from "@/lib/ui";

const MAX_BYTES = 1024 * 1024;

// Reduz e converte a imagem no navegador antes do envio (WebP; JPEG onde não houver suporte).
async function compress(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  for (const quality of [0.82, 0.7, 0.55]) {
    let blob = await toBlob("image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", quality);
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("too_large");
}

export function ImageUploader({
  folder,
  maxSide,
  label,
  onUploaded,
}: {
  /** Pasta no bucket, começando pelo id do catálogo. Ex.: "{catalogId}/items/{itemId}" */
  folder: string;
  maxSide: number;
  label: string;
  onUploaded: (path: string) => Promise<ActionState>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    startTransition(async () => {
      try {
        const blob = await compress(file, maxSide);
        const extension = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${folder}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await createClient()
          .storage.from(MEDIA_BUCKET)
          .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (uploadError) {
          setError("Não foi possível enviar a imagem. Tente novamente.");
          return;
        }
        const result = await onUploaded(path);
        if (result?.error) setError(result.error);
      } catch {
        setError("Não foi possível ler essa imagem. Use uma foto JPG ou PNG.");
      }
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={pending}
        className={ui.buttonSecondary}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Enviando…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
