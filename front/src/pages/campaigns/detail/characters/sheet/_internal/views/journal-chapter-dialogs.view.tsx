import { Trash2 } from "lucide-react";
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
import { Button } from "@/shared/components/atoms/button";
import { ACTION_LABELS } from "@/shared/constants/action-labels";
import { deleteChapterTitle, JOURNAL_LABELS } from "../constants/journal-labels";
import type { ChapterAutosave } from "../hooks/use-chapter-autosave";

interface DeleteChapterButtonProps {
  title: string;
  onDelete: () => void;
}

export function DeleteChapterButton({ title, onDelete }: DeleteChapterButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={ACTION_LABELS.delete}
          title={ACTION_LABELS.delete}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{deleteChapterTitle(title)}</AlertDialogTitle>
          <AlertDialogDescription>{JOURNAL_LABELS.deleteDescription}</AlertDialogDescription>
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

/** Rien n'est perdu sans ce choix : le dialogue ne se ferme que par l'une des deux versions. */
export function ConflictDialog({ autosave }: { autosave: ChapterAutosave }) {
  return (
    <AlertDialog open={autosave.status === "conflict"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{JOURNAL_LABELS.conflictTitle}</AlertDialogTitle>
          <AlertDialogDescription>{JOURNAL_LABELS.conflictDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={autosave.takeTheirs}>{JOURNAL_LABELS.takeTheirs}</AlertDialogCancel>
          <AlertDialogAction onClick={autosave.keepMine}>{JOURNAL_LABELS.keepMine}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
