"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { formatSlug } from "@/components/masked-inputs";
import { Field } from "@/components/painel/field";
import { SegmentPicker } from "@/components/painel/segment-picker";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/types";

// Primeiro acesso: nome, endereço e segmento do negócio.
export function OnboardingForm({
  action,
}: {
  action: (formData: FormData) => Promise<ActionState>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [segment, setSegment] = useState("");

  return (
    <ActionForm action={action} submitLabel="Criar catálogo" className="grid gap-6">
      <div className="grid gap-4">
        <Field label="Nome do negócio" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              // Enquanto a pessoa não mexer no endereço, ele acompanha o nome.
              if (!slugEdited) setSlug(formatSlug(event.target.value));
            }}
          />
        </Field>
        <Field
          label="Endereço do catálogo"
          htmlFor="slug"
          hint="É o link que você vai divulgar. Letras, números e hífens."
        >
          <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-2.5 text-sm text-muted-foreground">/</span>
            <input
              id="slug"
              name="slug"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="doces-da-maria"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(formatSlug(event.target.value));
              }}
              className="h-10 min-w-0 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
            />
          </div>
        </Field>
      </div>
      <SegmentPicker value={segment} onChange={setSegment} />
    </ActionForm>
  );
}

// Para catálogos criados antes de existir o segmento.
export function SegmentForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<ActionState>;
  initial: string;
}) {
  const [segment, setSegment] = useState(initial);
  return (
    <ActionForm action={action} submitLabel="Salvar segmento" className="grid gap-4">
      <SegmentPicker value={segment} onChange={setSegment} />
    </ActionForm>
  );
}
