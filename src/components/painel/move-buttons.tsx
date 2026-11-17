import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sobe ou desce um registro entre os vizinhos.
export function MoveButtons({
  action,
  id,
  index,
  total,
  name,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  index: number;
  total: number;
  name: string;
}) {
  if (total < 2) return null;
  return (
    <form action={action} className="flex shrink-0">
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        name="direction"
        value="up"
        variant="ghost"
        size="icon"
        disabled={index === 0}
        aria-label={`Subir ${name}`}
      >
        <ChevronUpIcon />
      </Button>
      <Button
        type="submit"
        name="direction"
        value="down"
        variant="ghost"
        size="icon"
        disabled={index === total - 1}
        aria-label={`Descer ${name}`}
      >
        <ChevronDownIcon />
      </Button>
    </form>
  );
}
