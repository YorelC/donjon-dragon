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
import { isFullyAssigned } from "../types/wizard-draft";
import { toFinalizePayload } from "../types/wizard-payload";
import {
  backgroundOf,
  classOf,
  featSpellcastingOf,
  type StepContext,
} from "../types/wizard-lookups";

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
    abilities: useAbilitiesStep(target, character, stepContext(catalog, wizard)),
    spells: useSpellsStep(stepContext(catalog, wizard)),
    finish: useFinishAction(target, wizard, character),
  };
}

/** `null` tant que le catalogue n'est pas là : rien n'est dérivable sans lui. */
function stepContext(
  catalog: DndCatalog | undefined,
  wizard: WizardState,
): StepContext | null {
  return catalog ? { catalog, draft: wizard.draft } : null;
}

function useDraftCharacter(target: WizardTarget): Character | undefined {
  const { data: characters } = useCampaignCharacters(target.campaignId);

  return characters?.find((entry) => entry.id === target.characterId);
}

function useAbilitiesStep(
  target: WizardTarget,
  character: Character | undefined,
  context: StepContext | null,
): WizardScreen["abilities"] {
  const roll = useRollAbilities(target.campaignId, target.characterId);

  return {
    roll: character?.abilityRoll ?? null,
    isRolling: roll.isPending,
    onRoll: () => roll.mutate(),
    background: context ? backgroundOf(context) ?? null : null,
  };
}

/**
 * Deux listes de sorts peuvent coexister : celle de la classe, et celle
 * qu'Initié à la magie fait choisir — chez le clerc, le druide ou le magicien.
 */
function useSpellsStep(context: StepContext | null): WizardScreen["spells"] {
  const classSpells = useClassSpells(context?.draft.classKey ?? null);
  const featSpells = useClassSpells(context?.draft.spellList ?? null);
  const spellcasting = context ? classOf(context)?.spellcasting : undefined;
  const featChoice = context ? featSpellcastingOf(context) : undefined;

  return {
    classSpells: classSpells.data ?? null,
    classCantripsKnown: spellcasting?.cantripsKnown ?? 0,
    classSpellsPrepared: spellcasting?.spellsPrepared ?? 0,
    featSpells: featSpells.data ?? null,
    featCantripsKnown: featChoice?.cantripsKnown ?? 0,
    featSpellsPrepared: featChoice?.spellsPrepared ?? 0,
    isLoading: classSpells.isLoading || featSpells.isLoading,
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
