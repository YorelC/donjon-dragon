import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Textarea } from "@/shared/components/atoms/textarea";

type ReviewedCharacter = Exclude<CampaignCharacterListItem, { projection: "pool" }>;

interface CharacterReviewActionsProps {
  character: ReviewedCharacter;
  reason: string;
  isPending: boolean;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onAccept: () => void;
  onRefuse: () => void;
}

export function CharacterReviewActionsView(props: CharacterReviewActionsProps) {
  if (isCorrectable(props.character)) {
    return <Button size="sm" onClick={props.onSubmit} disabled={props.isPending}>Soumettre</Button>;
  }
  if (props.character.projection !== "gameMaster" || props.character.review.status !== "submitted") {
    return null;
  }
  return <GameMasterDecision {...props} />;
}

function GameMasterDecision(props: CharacterReviewActionsProps) {
  return <div className="flex items-center gap-2.5">
    <Button size="sm" onClick={props.onAccept} disabled={props.isPending}>Accepter</Button>
    <RefusalDialog {...props} />
  </div>;
}

function RefusalDialog(props: CharacterReviewActionsProps) {
  const reasonIsMissing = props.reason.trim().length === 0;
  return <Dialog>
    <DialogTrigger asChild><Button size="sm" variant="destructive">Refuser</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Renvoyer la fiche en correction</DialogTitle>
        <DialogDescription>Le motif sera visible du créateur de la fiche.</DialogDescription>
      </DialogHeader>
      <Textarea
        value={props.reason}
        onChange={(event) => props.onReasonChange(event.target.value)}
        placeholder="Indiquez précisément ce qui doit être corrigé."
      />
      <DialogFooter>
        <Button onClick={props.onRefuse} disabled={props.isPending || reasonIsMissing}>Confirmer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function isCorrectable(character: ReviewedCharacter): boolean {
  return character.review.status === "draft" || character.review.status === "refused";
}
