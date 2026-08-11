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
import type { CampaignExit } from "../hooks/use-campaign-exit";
import { SuccessorPickerView } from "./successor-picker.view";

interface CampaignExitViewProps {
  exit: CampaignExit;
}

export function CampaignExitView({ exit }: CampaignExitViewProps) {
  return (
    <div className="flex flex-wrap gap-2 border-t pt-6">
      <LeaveDialog exit={exit} />
      {exit.isOwner ? <TransferDialog exit={exit} /> : null}
      {exit.isOwner ? <DeleteDialog exit={exit} /> : null}
    </div>
  );
}

function LeaveDialog({ exit }: CampaignExitViewProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={exit.isBusy}>
          Quitter la campagne
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter cette campagne ?</AlertDialogTitle>
          <AlertDialogDescription>
            {exit.needsSuccessor
              ? "Tu es propriétaire : désigne qui reprend la campagne avant de partir."
              : "Tu ne verras plus cette campagne dans ta liste."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {exit.needsSuccessor ? <SuccessorPickerView exit={exit} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={exit.onLeave}
            disabled={exit.isBusy || (exit.needsSuccessor && !exit.successor)}
          >
            Quitter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TransferDialog({ exit }: CampaignExitViewProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={exit.isBusy}>
          Transférer la propriété
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Transférer la propriété ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le nouveau propriétaire sera seul à pouvoir supprimer la campagne. Son
            rôle dans la partie ne change pas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <SuccessorPickerView exit={exit} />
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={exit.onTransfer}
            disabled={exit.isBusy || !exit.successor}
          >
            Transférer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteDialog({ exit }: CampaignExitViewProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={exit.isBusy}>
          Supprimer la campagne
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
          <AlertDialogDescription>
            Elle disparaîtra pour tous ses membres. Cette action est définitive.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={exit.onDelete}
            disabled={exit.isBusy}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
