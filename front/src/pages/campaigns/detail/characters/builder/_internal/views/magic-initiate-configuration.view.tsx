import type { Ability, CatalogOriginFeat, ClassKey, DndCatalog } from "@donjon-dragon/shared";
import { ABILITY_LABELS, type CharacterComposition } from "../types/character-composition";
import { ChoiceButtonView } from "./choice-button.view";

export interface MagicInitiateConfigurationProps {
  catalog: DndCatalog;
  feat: CatalogOriginFeat;
  composition: CharacterComposition;
  grantedBy: { type: "background" | "species"; key: string };
  onChange: (patch: Partial<CharacterComposition>) => void;
}

export function MagicInitiateConfiguration(props: MagicInitiateConfigurationProps) {
  const choice = props.feat.spellcastingChoice;
  if (!choice) return null;
  const selection = selectionOf(props);
  const fixedList = fixedListOf(props);
  const lists = fixedList ? [fixedList] : choice.spellListOptions;

  return <div className="grid gap-3">
    <ChoiceRow label="Liste de sorts">{lists.map((classKey) => (
      <ChoiceButtonView key={classKey} label={className(props.catalog, classKey)}
        selected={selection?.spellList === classKey}
        onSelect={() => updateSelection(props, { spellList: classKey, cantrips: [], spells: [] })} />
    ))}</ChoiceRow>
    <ChoiceRow label="Caractéristique d'incantation">{choice.abilityOptions.map((ability) => (
      <ChoiceButtonView key={ability} label={ABILITY_LABELS[ability as Ability]}
        selected={selection?.spellcastingAbility === ability}
        onSelect={() => updateSelection(props, { spellcastingAbility: ability })} />
    ))}</ChoiceRow>
  </div>;
}

function fixedListOf(props: MagicInitiateConfigurationProps): ClassKey | null {
  if (props.grantedBy.type !== "background") return null;
  return props.catalog.backgrounds.find((entry) => entry.key === props.grantedBy.key)
    ?.originFeatSpellList ?? null;
}

function className(catalog: DndCatalog, key: ClassKey): string {
  return catalog.classes.find((entry) => entry.key === key)?.name ?? key;
}

function selectionOf(props: MagicInitiateConfigurationProps) {
  return props.composition.magicInitiateChoices.find((choice) =>
    choice.grantedBy.type === props.grantedBy.type && choice.grantedBy.key === props.grantedBy.key);
}

function updateSelection(
  props: MagicInitiateConfigurationProps,
  patch: Partial<NonNullable<ReturnType<typeof selectionOf>>>,
) {
  const current = selectionOf(props) ?? emptySelection(props);
  const others = props.composition.magicInitiateChoices.filter((choice) =>
    choice.grantedBy.type !== props.grantedBy.type || choice.grantedBy.key !== props.grantedBy.key);
  props.onChange({ magicInitiateChoices: [...others, { ...current, ...patch }] });
}

function emptySelection(props: MagicInitiateConfigurationProps) {
  return {
    grantedBy: props.grantedBy, spellcastingAbility: null, spellList: null,
    cantrips: [], spells: [],
  };
}

function ChoiceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5">
    <p className="text-sm font-medium">{label}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>;
}
