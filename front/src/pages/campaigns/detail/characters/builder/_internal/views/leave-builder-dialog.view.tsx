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
import { Button } from "@/shared/components/atoms/button";

/**
 * Le retour à la liste passe par une confirmation : la création n'est
 * enregistrée qu'à la dernière étape, tout ce qui précède se perd en partant.
 */
export function LeaveBuilderDialogView({ backTo }: { backTo: string }) {
  return (
    <AlertDialog>
      <LeaveTrigger />
      {/* Mêmes modificateurs que la largeur de l'atome, pour la remplacer : ses deux boutons n'y tenaient pas. */}
      <AlertDialogContent className="data-[size=default]:sm:max-w-xl">
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

function LeaveTrigger() {
  return (
    <AlertDialogTrigger asChild>
      <Button type="button" variant="outline" size="sm">
        <span aria-hidden>←</span>
        Retour aux personnages
      </Button>
    </AlertDialogTrigger>
  );
}

function LeaveActions({ backTo }: { backTo: string }) {
  return (
    <AlertDialogFooter className="flex-wrap">
      <AlertDialogAction asChild>
        <Link to={backTo}>Quitter sans sauvegarder</Link>
      </AlertDialogAction>
      <AlertDialogCancel>Continuer la création</AlertDialogCancel>
    </AlertDialogFooter>
  );
}
