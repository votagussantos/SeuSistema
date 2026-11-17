"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Campos que formatam o valor enquanto a pessoa digita. Todos enviam o texto já
// formatado; o servidor normaliza e valida de novo.

type Base = Omit<ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange">;

const moneyFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 });

/** Centavos do banco para o campo: 123456 -> "1.234,56". */
export function centsToMoney(cents: number | null | undefined) {
  return cents == null ? "" : moneyFormat.format(cents / 100);
}

/** Campo formatado de volta para centavos: "1.234,56" -> 123456. */
export function moneyToCents(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : null;
}

/** "123456" -> "1.234,56". Os dígitos entram pela direita, como em maquininha. */
export function formatMoneyDigits(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
  return digits ? moneyFormat.format(parseInt(digits, 10) / 100) : "";
}

export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: Base & { value: string; onValueChange: (value: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center font-mono text-xs text-muted-foreground">
        R$
      </span>
      <Input
        {...props}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onValueChange(formatMoneyDigits(event.target.value))}
        className={cn("pl-9 font-mono", className)}
      />
    </div>
  );
}

/** Versão sem estado externo, para formulários simples. */
export function MoneyField({ defaultValue = "", ...props }: Base & { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <MoneyInput {...props} value={value} onValueChange={setValue} />;
}

/** "11999998888" -> "(11) 99999-8888". Aceita número colado com +55. */
export function formatPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function PhoneInput({ defaultValue = "", ...props }: Base & { defaultValue?: string }) {
  const [value, setValue] = useState(formatPhone(defaultValue));
  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(11) 99999-8888"
      value={value}
      onChange={(event) => setValue(formatPhone(event.target.value))}
    />
  );
}

/** Só dígitos, para estoque e duração. */
export function IntegerInput({
  defaultValue = "",
  maxDigits = 6,
  ...props
}: Base & { defaultValue?: string; maxDigits?: number }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, maxDigits))}
    />
  );
}

/** Endereço do catálogo: minúsculas, sem acento, hífen no lugar de espaço. */
export function formatSlug(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40);
}

/** Nome de usuário do Instagram: sem @, espaços ou caracteres inválidos. */
export function InstagramInput({ defaultValue = "", ...props }: Base & { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
        @
      </span>
      <Input
        {...props}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) =>
          setValue(event.target.value.replace(/[^A-Za-z0-9._]/g, "").slice(0, 30))
        }
        className="pl-7"
      />
    </div>
  );
}
