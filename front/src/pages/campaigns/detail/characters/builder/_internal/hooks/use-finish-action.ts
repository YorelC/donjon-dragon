import { useNavigate } from "react-router-dom";
import { toCampaignDetailCharacters, toCharacterSheet } from "@/shared/constants/routes";
import type { BuilderScreen } from "../views/character-builder.view";
import type { BuilderState } from "./use-character-builder";
import type { BuilderTarget } from "./use-builder-screen";
import {
  useCreateCharacter,
  useFinalizeCharacter,
} from "../queries/use-character-creation";
import { toFinalizePayload } from "../types/character-payload";

type Navigate = ReturnType<typeof useNavigate>;
type FinishAction = Pick<BuilderScreen, "isFinishing" | "finishLabel" | "onFinish">;

/**
 * Deux chemins pour finir : créer, ou enregistrer une édition. Les deux
 * mutations sont montées inconditionnellement — les Rules of Hooks l'exigent —
 * et seule celle du mode courant est jamais déclenchée.
 */
export function useFinishAction(target: BuilderTarget, builder: BuilderState): FinishAction {
  const navigate = useNavigate();
  const create = useCreateCharacter(target.campaignId);
  const finalize = useFinalizeCharacter(target.campaignId, target.characterId ?? "");

  return target.characterId
    ? editFinishAction(target.campaignId, builder, finalize, navigate)
    : createFinishAction(target.campaignId, builder, create, navigate);
}

function createFinishAction(
  campaignId: string,
  builder: BuilderState,
  create: ReturnType<typeof useCreateCharacter>,
  navigate: Navigate,
): FinishAction {
  return {
    isFinishing: create.isPending,
    finishLabel: "Créer le personnage",
    onFinish: () => {
      const payload = toFinalizePayload(builder.composition);
      if (!payload) return;

      create.mutate(payload, {
        onSuccess: (created) => navigate(toCharacterSheet(campaignId, created.id)),
      });
    },
  };
}

function editFinishAction(
  campaignId: string,
  builder: BuilderState,
  finalize: ReturnType<typeof useFinalizeCharacter>,
  navigate: Navigate,
): FinishAction {
  return {
    isFinishing: finalize.isPending,
    finishLabel: "Enregistrer les modifications",
    onFinish: () => {
      const payload = toFinalizePayload(builder.composition);
      if (!payload) return;

      finalize.mutate(payload, {
        onSuccess: () => navigate(toCampaignDetailCharacters(campaignId)),
      });
    },
  };
}
