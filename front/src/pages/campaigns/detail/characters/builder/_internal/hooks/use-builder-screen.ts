import { useMemo } from "react";
import type {
  CampaignCharacterListItem,
  ComputedCharacter,
  DndCatalog,
  IssuedAbilityRoll,
  Item,
} from "@donjon-dragon/shared";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { useItemCatalog } from "@/shared/queries/use-item-catalog";
import type { BuilderScreen } from "../views/character-builder.view";
import type { BuilderState } from "./use-character-builder";
import { useCharacterBuilder } from "./use-character-builder";
import { useCharacterPreview } from "./use-character-preview";
import { useCharacterBuild } from "../queries/use-character-build";
import { useRollAbilities } from "../queries/use-character-creation";
import { useFinishAction } from "./use-finish-action";
import { isFullyAssigned, type CharacterComposition } from "../types/character-composition";
import { toComposition } from "../types/character-build-detail";
import { backgroundOf, type StepContext } from "../types/builder-lookups";
import { useSpellsStep } from "./use-spells-step";

export interface BuilderTarget {
  campaignId: string;
  /** `null` : le builder crée un personnage, il n'y a pas encore d'id. */
  characterId: string | null;
  expectedRevision?: number;
}

/**
 * Rassemble tout ce dont l'écran a besoin. Sans lui, le container porterait dix
 * appels de hooks et dépasserait largement ses vingt lignes.
 */
export function useBuilderScreen(target: BuilderTarget): BuilderScreen | null {
  const context = useBuilderContext(target);
  const { catalog, builder, preview } = context;
  if (!catalog) return null;
  if (isExistingBuilderLoading(target, context)) return null;
  if (context.character && !isCorrectable(context.character)) return null;

  return {
    catalog,
    items: context.items,
    builder,
    preview,
    abilities: context.abilities,
    spells: context.spells,
    characterName: characterNameOf(target, context.character, builder),
    isEditing: false,
    canFinish:
      isFullyAssigned(builder.composition) && preview !== null && builder.isValid("identity"),
    ...context.finish,
  };
}

function isExistingBuilderLoading(target: BuilderTarget, context: BuilderContext): boolean {
  if (!target.characterId) return false;

  return !context.character || context.buildDetail.isLoading;
}

function isCorrectable(character: CampaignCharacterListItem): boolean {
  if (character.projection === "pool") return false;

  return character.review.status === "draft" || character.review.status === "refused";
}

const NEW_CHARACTER_TITLE = "Nouveau personnage";

function characterNameOf(
  target: BuilderTarget,
  character: CampaignCharacterListItem | undefined,
  builder: BuilderState,
): string {
  if (target.characterId) return character?.name ?? "";

  return builder.composition.name || NEW_CHARACTER_TITLE;
}

interface BuilderContext {
  catalog: DndCatalog | undefined;
  items: Item[];
  character: CampaignCharacterListItem | undefined;
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
  const initial = useInitialComposition(buildDetail.data, catalog);
  const builder = useCharacterBuilder(catalog, initial);
  const rollAbilities = useRollAbilities(target.campaignId);

  return {
    catalog,
    items: items ?? [],
    character,
    buildDetail,
    builder,
    preview: useCharacterPreview(target.campaignId, builder.composition, catalog),
    abilities: useAbilitiesStep(builder, stepContext(catalog, builder), rollAbilities),
    spells: useSpellsStep(stepContext(catalog, builder)),
    finish: useFinishAction(withRevision(target, character), builder, catalog),
  };
}

function withRevision(
  target: BuilderTarget,
  character: CampaignCharacterListItem | undefined,
): BuilderTarget {
  const expectedRevision = character && 'revision' in character ? character.revision : undefined;
  return { ...target, expectedRevision };
}

/** Sans catalogue, la taille n'est pas classable en choix ou en dérivée. */
function useInitialComposition(
  buildDetail: ReturnType<typeof useCharacterBuild>["data"],
  catalog: DndCatalog | undefined,
): CharacterComposition | null {
  return useMemo(
    () => (buildDetail && catalog ? toComposition(buildDetail, catalog) : null),
    [buildDetail, catalog],
  );
}

/** `null` tant que le catalogue n'est pas là : rien n'est dérivable sans lui. */
function stepContext(
  catalog: DndCatalog | undefined,
  builder: BuilderState,
): StepContext | null {
  return catalog ? { catalog, composition: builder.composition } : null;
}

function useExistingCharacter(
  target: BuilderTarget,
): CampaignCharacterListItem | undefined {
  const { data: characters } = useCampaignCharacters(target.campaignId);
  if (!target.characterId) return undefined;

  return characters?.find((entry) => entry.id === target.characterId);
}

function useAbilitiesStep(
  builder: BuilderState,
  context: StepContext | null,
  rollAbilities: ReturnType<typeof useRollAbilities>,
): BuilderScreen["abilities"] {
  return {
    roll: builder.composition.abilityRoll,
    onRoll: () => rollAbilities.mutate(undefined, { onSuccess: (issued) => keep(builder, issued) }),
    isRolling: rollAbilities.isPending,
    background: context ? backgroundOf(context) ?? null : null,
  };
}

/** Les dés servent à l'affichage, l'identité au serveur : on garde les deux. */
function keep(builder: BuilderState, issued: IssuedAbilityRoll): void {
  builder.update({
    abilityRoll: { dice: issued.dice, totals: issued.totals },
    abilityRollId: issued.rollId,
  });
}
