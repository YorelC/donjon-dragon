import type { ReactElement } from "react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Textarea } from "@/shared/components/atoms/textarea";
import type { CharacterReviewActions } from "../hooks/use-character-review-actions";

type ReviewedCharacter = CampaignCharacterListItem;

interface CharacterReviewActionsProps {
  character: ReviewedCharacter;
  review: CharacterReviewActions;
}

type ReviewCase = "creatorValidation" | "submission" | "gameMasterDecision" | "none";

export function CharacterReviewActionsView(props: CharacterReviewActionsProps) {
  const Actions = REVIEW_ACTIONS[toReviewCase(props.character)];
  return <Actions {...props} />;
}

/**
 * Le MJ fait foi sur la fiche qu'il a créée : il la valide sans se la soumettre. Une
 * fiche qu'il aurait déjà soumise se valide par l'acceptation, sans refus possible.
 */
function CreatorValidation({ character, review }: CharacterReviewActionsProps) {
  const onValidate = character.review.status === "submitted" ? review.onAccept : review.onValidate;
  return <Button size="sm" onClick={onValidate} disabled={review.isPending}>Valider</Button>;
}

function Submission({ review }: CharacterReviewActionsProps) {
  return <Button size="sm" onClick={review.onSubmit} disabled={review.isPending}>Soumettre</Button>;
}

function GameMasterDecision(props: CharacterReviewActionsProps) {
  return <div className="flex items-center gap-2.5">
    <Button size="sm" onClick={props.review.onAccept} disabled={props.review.isPending}>
      Accepter
    </Button>
    <RefusalDialog {...props} />
  </div>;
}

function RefusalDialog({ review }: CharacterReviewActionsProps) {
  const reasonIsMissing = review.reason.trim().length === 0;
  return <Dialog>
    <DialogTrigger asChild><Button size="sm" variant="destructive">Refuser</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Renvoyer la fiche en correction</DialogTitle>
        <DialogDescription>Le motif sera visible du créateur de la fiche.</DialogDescription>
      </DialogHeader>
      <Textarea
        value={review.reason}
        onChange={(event) => review.onReasonChange(event.target.value)}
        placeholder="Indiquez précisément ce qui doit être corrigé."
      />
      <DialogFooter>
        <Button onClick={review.onRefuse} disabled={review.isPending || reasonIsMissing}>Confirmer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function NoAction(): null {
  return null;
}

const REVIEW_ACTIONS: Record<
  ReviewCase,
  (props: CharacterReviewActionsProps) => ReactElement | null
> = {
  creatorValidation: CreatorValidation,
  submission: Submission,
  gameMasterDecision: GameMasterDecision,
  none: NoAction,
};

/** L'ordre compte : le MJ créateur valide avant qu'on lui propose de soumettre. */
const REVIEW_CASE_RULES: ReadonlyArray<[ReviewCase, (character: ReviewedCharacter) => boolean]> = [
  ["creatorValidation", isValidatableByCreator],
  ["submission", isCorrectable],
  ["gameMasterDecision", awaitsGameMasterDecision],
];

function toReviewCase(character: ReviewedCharacter): ReviewCase {
  const rule = REVIEW_CASE_RULES.find(([, matches]) => matches(character));
  return rule?.[0] ?? "none";
}

function isValidatableByCreator(character: ReviewedCharacter): boolean {
  return character.projection === "gameMaster"
    && character.createdByMe
    && character.review.status !== "accepted";
}

function isCorrectable(character: ReviewedCharacter): boolean {
  return character.review.status === "draft" || character.review.status === "refused";
}

function awaitsGameMasterDecision(character: ReviewedCharacter): boolean {
  return character.projection === "gameMaster" && character.review.status === "submitted";
}
