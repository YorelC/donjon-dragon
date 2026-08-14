import { useNavigate } from "react-router-dom";
import type { Character, ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useClassSpells, useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import type { BuilderScreen } from "../views/character-builder.view";
import type { BuilderState } from "./use-character-builder";
import { useCharacterBuilder } from "./use-character-builder";
import { useCharacterPreview } from "./use-character-preview";
import {
  useFinalizeCharacter,
  useRollAbilities,
} from "../queries/use-character-creation";
import { isFullyAssigned } from "../types/character-draft";
import { toFinalizePayload } from "../types/character-payload";
import {
  backgroundOf,
  classOf,
  featSpellcastingOf,
  type StepContext,
} from "../types/builder-lookups";

export interface BuilderTarget {
  campaignId: string;
  characterId: string;
}

/**
 * Rassemble tout ce dont l'écran a besoin. Sans lui, le container porterait dix
 * appels de hooks et dépasserait largement ses vingt lignes.
 */
export function useBuilderScreen(target: BuilderTarget): BuilderScreen | null {
  const context = useBuilderContext(target);
  const { catalog, character, builder, preview } = context;
  if (!catalog || !character) return null;

  return {
    catalog,
    builder,
    preview,
    abilities: context.abilities,
    spells: context.spells,
    characterName: character.name,
    canFinish: isFullyAssigned(builder.draft) && preview !== null,
    ...context.finish,
  };
}

interface BuilderContext {
  catalog: DndCatalog | undefined;
  character: Character | undefined;
  builder: BuilderState;
  preview: ComputedCharacter | null;
  abilities: BuilderScreen["abilities"];
  spells: BuilderScreen["spells"];
  finish: Pick<BuilderScreen, "isFinishing" | "onFinish">;
}

/** Tous les appels de hooks, au même endroit et dans un ordre stable. */
function useBuilderContext(target: BuilderTarget): BuilderContext {
  const { data: catalog } = useDndCatalog();
  const character = useDraftCharacter(target);
  const builder = useCharacterBuilder(catalog);
  const totals = character?.abilityRoll?.totals ?? [];

  return {
    catalog,
    character,
    builder,
    preview: useCharacterPreview(target.campaignId, builder.draft, totals),
    abilities: useAbilitiesStep(target, character, stepContext(catalog, builder)),
    spells: useSpellsStep(stepContext(catalog, builder)),
    finish: useFinishAction(target, builder, character),
  };
}

/** `null` tant que le catalogue n'est pas là : rien n'est dérivable sans lui. */
function stepContext(
  catalog: DndCatalog | undefined,
  builder: BuilderState,
): StepContext | null {
  return catalog ? { catalog, draft: builder.draft } : null;
}

function useDraftCharacter(target: BuilderTarget): Character | undefined {
  const { data: characters } = useCampaignCharacters(target.campaignId);

  return characters?.find((entry) => entry.id === target.characterId);
}

function useAbilitiesStep(
  target: BuilderTarget,
  character: Character | undefined,
  context: StepContext | null,
): BuilderScreen["abilities"] {
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
function useSpellsStep(context: StepContext | null): BuilderScreen["spells"] {
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
  target: BuilderTarget,
  builder: BuilderState,
  character: Character | undefined,
): Pick<BuilderScreen, "isFinishing" | "onFinish"> {
  const finalize = useFinalizeCharacter(target.campaignId, target.characterId);
  const navigate = useNavigate();
  const totals = character?.abilityRoll?.totals ?? [];

  return {
    isFinishing: finalize.isPending,
    onFinish: () => {
      const payload = toFinalizePayload(builder.draft, totals, character?.name ?? "");
      if (!payload) return;

      finalize.mutate(payload, {
        onSuccess: () => navigate(toCampaignDetailCharacters(target.campaignId)),
      });
    },
  };
}
