import { useMemo } from "react";
import type { Character, ComputedCharacter, DndCatalog, Item } from "@donjon-dragon/shared";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useClassSpells, useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { useItemCatalog } from "@/shared/queries/use-item-catalog";
import type { BuilderScreen } from "../views/character-builder.view";
import type { BuilderState } from "./use-character-builder";
import { useCharacterBuilder } from "./use-character-builder";
import { useCharacterPreview } from "./use-character-preview";
import { useCharacterBuild } from "../queries/use-character-build";
import { useFinishAction } from "./use-finish-action";
import { isFullyAssigned, type CharacterComposition } from "../types/character-composition";
import { toComposition } from "../types/character-build-detail";
import { rollAbilities } from "../types/roll-abilities";
import {
  backgroundOf,
  classOf,
  featSpellcastingOf,
  type StepContext,
} from "../types/builder-lookups";

export interface BuilderTarget {
  campaignId: string;
  /** `null` : le builder crée un personnage, il n'y a pas encore d'id. */
  characterId: string | null;
}

/**
 * Rassemble tout ce dont l'écran a besoin. Sans lui, le container porterait dix
 * appels de hooks et dépasserait largement ses vingt lignes.
 */
export function useBuilderScreen(target: BuilderTarget): BuilderScreen | null {
  const context = useBuilderContext(target);
  const { catalog, builder, preview } = context;
  if (!catalog) return null;
  if (target.characterId && !context.character) return null;
  if (target.characterId && context.buildDetail.isLoading) return null;

  return {
    catalog,
    items: context.items,
    builder,
    preview,
    abilities: context.abilities,
    spells: context.spells,
    characterName: characterNameOf(target, context.character, builder),
    canFinish:
      isFullyAssigned(builder.composition) && preview !== null && builder.isValid("name"),
    ...context.finish,
  };
}

const NEW_CHARACTER_TITLE = "Nouveau personnage";

function characterNameOf(
  target: BuilderTarget,
  character: Character | undefined,
  builder: BuilderState,
): string {
  if (target.characterId) return character?.name ?? "";

  return builder.composition.name || NEW_CHARACTER_TITLE;
}

interface BuilderContext {
  catalog: DndCatalog | undefined;
  items: Item[];
  character: Character | undefined;
  buildDetail: ReturnType<typeof useCharacterBuild>;
  builder: BuilderState;
  preview: ComputedCharacter | null;
  abilities: BuilderScreen["abilities"];
  spells: BuilderScreen["spells"];
  finish: Pick<BuilderScreen, "isFinishing" | "finishLabel" | "onFinish">;
}

/** Tous les appels de hooks, au même endroit et dans un ordre stable. */
function useBuilderContext(target: BuilderTarget): BuilderContext {
  const { data: catalog } = useDndCatalog();
  const { data: items } = useItemCatalog();
  const character = useExistingCharacter(target);
  const buildDetail = useCharacterBuild(target.campaignId, target.characterId);
  const initial = useInitialComposition(buildDetail.data);
  const builder = useCharacterBuilder(catalog, initial);

  return {
    catalog,
    items: items ?? [],
    character,
    buildDetail,
    builder,
    preview: useCharacterPreview(target.campaignId, builder.composition, catalog),
    abilities: useAbilitiesStep(builder, stepContext(catalog, builder)),
    spells: useSpellsStep(stepContext(catalog, builder)),
    finish: useFinishAction(target, builder, catalog),
  };
}

function useInitialComposition(
  buildDetail: ReturnType<typeof useCharacterBuild>["data"],
): CharacterComposition | null {
  return useMemo(() => (buildDetail ? toComposition(buildDetail) : null), [buildDetail]);
}

/** `null` tant que le catalogue n'est pas là : rien n'est dérivable sans lui. */
function stepContext(
  catalog: DndCatalog | undefined,
  builder: BuilderState,
): StepContext | null {
  return catalog ? { catalog, composition: builder.composition } : null;
}

function useExistingCharacter(target: BuilderTarget): Character | undefined {
  const { data: characters } = useCampaignCharacters(target.campaignId);
  if (!target.characterId) return undefined;

  return characters?.find((entry) => entry.id === target.characterId);
}

function useAbilitiesStep(
  builder: BuilderState,
  context: StepContext | null,
): BuilderScreen["abilities"] {
  return {
    roll: builder.composition.abilityRoll,
    onRoll: () => builder.update({ abilityRoll: rollAbilities() }),
    background: context ? backgroundOf(context) ?? null : null,
  };
}

/**
 * Deux listes de sorts peuvent coexister : celle de la classe, et celle
 * qu'Initié à la magie fait choisir — chez le clerc, le druide ou le magicien.
 */
function useSpellsStep(context: StepContext | null): BuilderScreen["spells"] {
  const classSpells = useClassSpells(context?.composition.classKey ?? null);
  const featSpells = useClassSpells(context?.composition.spellList ?? null);
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
