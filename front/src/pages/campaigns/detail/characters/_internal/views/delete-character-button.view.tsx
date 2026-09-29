import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/atoms/button";
import { ACTION_LABELS } from "@/shared/constants/action-labels";
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
} from "@/shared/components/atoms/alert-dialog";
import { IconAction } from "./icon-action.view";

interface DeleteCharacterButtonProps {
  characterName: string;
  onDelete: () => void;
}

export function DeleteCharacterButton({ characterName, onDelete }: DeleteCharacterButtonProps) {
  return (
    <AlertDialog>
      <IconAction label={ACTION_LABELS.delete}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={ACTION_LABELS.delete}
            className="text-ink-meta hover:text-gold-value"
          >
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
      </IconAction>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {characterName} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le personnage sera définitivement supprimé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            {ACTION_LABELS.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
