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
} from "@/shared/components/atoms/alert-dialog";
import { Button } from "@/shared/components/atoms/button";
import type { LeaveGuard } from "../hooks/use-leave-guard";

export interface LeaveBuilder extends LeaveGuard {
  /** La liste des personnages de la campagne, où ramène le bouton de sortie. */
  backTo: string;
}

/**
 * Toute sortie passe par une confirmation : la création n'est enregistrée qu'à
 * la dernière étape, tout ce qui précède se perd en partant. Le bouton de retour
 * et les liens du bandeau ouvrent la même modale, chacun avec sa destination.
 */
export function LeaveBuilderDialogView({ leave }: { leave: LeaveBuilder }) {
  return (
    <>
      <LeaveTrigger onClick={() => leave.onRequest(leave.backTo)} />
      <LeaveDialog leave={leave} />
    </>
  );
}

function LeaveTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <span aria-hidden>←</span>
      Retour aux personnages
    </Button>
  );
}

function LeaveDialog({ leave }: { leave: LeaveBuilder }) {
  return (
    <AlertDialog open={leave.pendingTo !== null} onOpenChange={toCloseHandler(leave)}>
      {/* Mêmes modificateurs que la largeur de l'atome, pour la remplacer : ses deux boutons n'y tenaient pas. */}
      <AlertDialogContent className="data-[size=default]:sm:max-w-xl">
        <LeaveHeader />
        <LeaveActions to={leave.pendingTo ?? leave.backTo} />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LeaveHeader() {
  return (
    <AlertDialogHeader>
      <span className="eyebrow">Quitter la création</span>
      <AlertDialogTitle>Votre progression ne sera pas sauvegardée</AlertDialogTitle>
      <AlertDialogDescription>
        Les choix faits pour ce personnage seront perdus si vous quittez la création maintenant.
      </AlertDialogDescription>
    </AlertDialogHeader>
  );
}

function LeaveActions({ to }: { to: string }) {
  return (
    <AlertDialogFooter className="flex-wrap">
      <AlertDialogAction asChild>
        <Link to={to}>Quitter sans sauvegarder</Link>
      </AlertDialogAction>
      <AlertDialogCancel>Continuer la création</AlertDialogCancel>
    </AlertDialogFooter>
  );
}

/** Radix ne signale que l'ouverture et la fermeture : seule la fermeture annule. */
function toCloseHandler(leave: LeaveBuilder) {
  return (open: boolean) => {
    if (!open) leave.onCancel();
  };
}
