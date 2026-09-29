import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/atoms/button";
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

const DELETE_LABEL = "Supprimer";

export function DeleteCharacterButton({ characterName, onDelete }: DeleteCharacterButtonProps) {
  return (
    <AlertDialog>
      <IconAction label={DELETE_LABEL}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={DELETE_LABEL}
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
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            {DELETE_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
