import { useNavigate } from "react-router-dom";
import type { Character, ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useClassSpells, useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import type { WizardScreen } from "../views/character-wizard.view";
import type { WizardState } from "./use-character-wizard";
import { useCharacterWizard } from "./use-character-wizard";
import { useWizardPreview } from "./use-wizard-preview";
import {
  useFinalizeCharacter,
  useRollAbilities,
} from "../queries/use-character-creation";
import { isFullyAssigned, toFinalizePayload } from "../types/wizard-draft";

export interface WizardTarget {
  campaignId: string;
  characterId: string;
}

/**
 * Rassemble tout ce dont l'écran a besoin. Sans lui, le container porterait dix
 * appels de hooks et dépasserait largement ses vingt lignes.
 */
export function useWizardScreen(target: WizardTarget): WizardScreen | null {
  const context = useWizardContext(target);
  const { catalog, character, wizard, preview } = context;
  if (!catalog || !character) return null;

  return {
    catalog,
    wizard,
    preview,
    abilities: context.abilities,
    spells: context.spells,
    characterName: character.name,
    canFinish: isFullyAssigned(wizard.draft) && preview !== null,
    ...context.finish,
  };
}

interface WizardContext {
  catalog: DndCatalog | undefined;
  character: Character | undefined;
  wizard: WizardState;
  preview: ComputedCharacter | null;
  abilities: WizardScreen["abilities"];
  spells: WizardScreen["spells"];
  finish: Pick<WizardScreen, "isFinishing" | "onFinish">;
}

/** Tous les appels de hooks, au même endroit et dans un ordre stable. */
function useWizardContext(target: WizardTarget): WizardContext {
  const { data: catalog } = useDndCatalog();
  const character = useDraftCharacter(target);
  const wizard = useCharacterWizard(catalog);
  const totals = character?.abilityRoll?.totals ?? [];

  return {
    catalog,
    character,
    wizard,
    preview: useWizardPreview(target.campaignId, wizard.draft, totals),
    abilities: useAbilitiesStep(target, character),
    spells: useSpellsStep(catalog, wizard),
    finish: useFinishAction(target, wizard, character),
  };
}

function useDraftCharacter(target: WizardTarget): Character | undefined {
  const { data: characters } = useCampaignCharacters(target.campaignId);

  return characters?.find((entry) => entry.id === target.characterId);
}

function useAbilitiesStep(
  target: WizardTarget,
  character: Character | undefined,
): WizardScreen["abilities"] {
  const roll = useRollAbilities(target.campaignId, target.characterId);

  return {
    roll: character?.abilityRoll ?? null,
    isRolling: roll.isPending,
    onRoll: () => roll.mutate(),
  };
}

function useSpellsStep(
  catalog: DndCatalog | undefined,
  wizard: WizardState,
): WizardScreen["spells"] {
  const spells = useClassSpells(wizard.draft.classKey);
  const spellcasting = catalog?.classes.find(
    (entry) => entry.key === wizard.draft.classKey,
  )?.spellcasting;

  return {
    spells: spells.data ?? null,
    cantripsKnown: spellcasting?.cantripsKnown ?? 0,
    spellsPrepared: spellcasting?.spellsPrepared ?? 0,
    isLoading: spells.isLoading,
  };
}

function useFinishAction(
  target: WizardTarget,
  wizard: WizardState,
  character: Character | undefined,
): Pick<WizardScreen, "isFinishing" | "onFinish"> {
  const finalize = useFinalizeCharacter(target.campaignId, target.characterId);
  const navigate = useNavigate();
  const totals = character?.abilityRoll?.totals ?? [];

  return {
    isFinishing: finalize.isPending,
    onFinish: () => {
      const payload = toFinalizePayload(wizard.draft, totals, character?.name ?? "");
      if (!payload) return;

      finalize.mutate(payload, {
        onSuccess: () => navigate(toCampaignDetailCharacters(target.campaignId)),
      });
    },
  };
}
