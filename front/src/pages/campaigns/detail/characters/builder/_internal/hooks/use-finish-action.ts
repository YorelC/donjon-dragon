import { useNavigate } from "react-router-dom";
import type {
  CreateCharacterDto,
  DndCatalog,
  FinalizeCharacterDto,
} from "@donjon-dragon/shared";
import { toCampaignDetailCharacters, toCharacterSheet } from "@/shared/constants/routes";
import type { BuilderScreen } from "../views/character-builder.view";
import type { BuilderState } from "./use-character-builder";
import type { BuilderTarget } from "./use-builder-screen";
import {
  useCreateCharacter,
  useFinalizeCharacter,
} from "../queries/use-character-creation";
import { toCreatePayload, toEditPayload } from "../types/character-payload";

type Navigate = ReturnType<typeof useNavigate>;
type FinishAction = Pick<BuilderScreen, "isFinishing" | "finishLabel" | "onFinish">;

/**
 * Deux chemins pour finir : créer, ou enregistrer une édition. Les deux
 * mutations sont montées inconditionnellement — les Rules of Hooks l'exigent —
 * et seule celle du mode courant est jamais déclenchée.
 */
export function useFinishAction(
  target: BuilderTarget,
  builder: BuilderState,
  catalog: DndCatalog | undefined,
): FinishAction {
  const navigate = useNavigate();
  const create = useCreateCharacter(target.campaignId);
  const finalize = useFinalizeCharacter(target.campaignId, target.characterId ?? "");
  const { composition } = builder;

  // Deux contrats, deux payloads : l'édition ne redésigne jamais de tirage.
  // Sans catalogue, le paquetage n'est pas résoluble : rien à envoyer.
  if (target.characterId) {
    const payload = () => (
      catalog && target.expectedRevision !== undefined
        ? toEditPayload(catalog, composition, target.expectedRevision)
        : null
    );
    return editFinishAction(target.campaignId, { payload, finalize }, navigate);
  }

  const payload = () => (catalog ? toCreatePayload(catalog, composition) : null);
  return createFinishAction(target.campaignId, { payload, create }, navigate);
}

interface CreateSubmission {
  payload: () => CreateCharacterDto | null;
  create: ReturnType<typeof useCreateCharacter>;
}

function createFinishAction(
  campaignId: string,
  submission: CreateSubmission,
  navigate: Navigate,
): FinishAction {
  return {
    isFinishing: submission.create.isPending,
    finishLabel: "Créer le personnage",
    onFinish: () => {
      const payload = submission.payload();
      if (!payload) return;

      submission.create.mutate(payload, {
        onSuccess: (created) => navigate(toCharacterSheet(campaignId, created.id)),
      });
    },
  };
}

interface EditSubmission {
  payload: () => FinalizeCharacterDto | null;
  finalize: ReturnType<typeof useFinalizeCharacter>;
}

function editFinishAction(
  campaignId: string,
  submission: EditSubmission,
  navigate: Navigate,
): FinishAction {
  return {
    isFinishing: submission.finalize.isPending,
    finishLabel: "Enregistrer les modifications",
    onFinish: () => {
      const payload = submission.payload();
      if (!payload) return;

      submission.finalize.mutate(payload, {
        onSuccess: () => navigate(toCampaignDetailCharacters(campaignId)),
      });
    },
  };
}
