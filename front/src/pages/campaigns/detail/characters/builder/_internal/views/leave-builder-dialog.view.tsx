import { Link } from "react-router-dom";
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

/**
 * Le retour à la liste passe par une confirmation : la création n'est
 * enregistrée qu'à la dernière étape, tout ce qui précède se perd en partant.
 */
export function LeaveBuilderDialogView({ backTo }: { backTo: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="eyebrow inline-flex items-center gap-2 transition-[color] duration-[.18s] hover:text-gold-link-hover">
        <span aria-hidden>←</span>
        Retour aux personnages
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className="eyebrow">Quitter la création</span>
          <AlertDialogTitle>Votre progression ne sera pas sauvegardée</AlertDialogTitle>
          <AlertDialogDescription>
            Les choix faits pour ce personnage seront perdus si vous retournez à la liste
            maintenant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <LeaveActions backTo={backTo} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LeaveActions({ backTo }: { backTo: string }) {
  return (
    <AlertDialogFooter>
      <AlertDialogAction asChild>
        <Link to={backTo}>Quitter sans sauvegarder</Link>
      </AlertDialogAction>
      <AlertDialogCancel>Continuer la création</AlertDialogCancel>
    </AlertDialogFooter>
  );
}
