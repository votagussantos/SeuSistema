"use client";

import { Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Botão de excluir que pede confirmação antes de chamar a Server Action.
export function ConfirmDelete({
  action,
  id,
  title,
  description,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  title: string;
  description: string;
  /** Texto do botão; sem ele, mostra só o ícone. */
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant={label ? "destructive" : "ghost"}
            size={label ? "default" : "icon"}
            aria-label={label ? undefined : title}
          />
        }
      >
        <Trash2Icon />
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              Excluir
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
