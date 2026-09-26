import type { CatalogSpell, CatalogSpellList, ClassKey } from "@donjon-dragon/shared";
import type { CharacterComposition } from "../types/character-composition";
import type { SpellSource } from "../types/chosen-spells";
import { SpellGroup, selectionOf } from "./spell-group.view";

export interface SpellsStep {
  classSpells: CatalogSpellList | null;
  classCantripsKnown: number;
  classSpellsPrepared: number;
  /** Nul hors Magicien, qui remplit son grimoire au lieu de préparer ses sorts. */
  spellbookSize: number;
  /** La liste d'Initié à la magie, quand un don en accorde une. */
  featSpells: CatalogSpellList | null;
  featCantripsKnown: number;
  featSpellsPrepared: number;
  featSpellLists: Partial<Record<ClassKey, CatalogSpellList>>;
  /** Les sorts que l'espèce, la lignée ou la classe accorde : ils ne se choisissent pas. */
  grantedSpells: string[];
  tomeSpells: { cantrips: CatalogSpell[]; rituals: CatalogSpell[] };
  isLoading: boolean;
}

interface SpellsStepViewProps {
  step: SpellsStep;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/** Les sorts mineurs, de la classe et du don, sur le même écran. */
export function CantripsStepView({ step, composition, onChange }: SpellsStepViewProps) {
  if (step.isLoading) return <Loading />;

  return (
    <div className="grid gap-6">
      <SpellGroup
        title="Sorts mineurs de classe"
        spells={step.classSpells?.cantrips ?? []}
        limit={step.classCantripsKnown}
        selection={selectionOf(sourceOf(step, composition), composition.classCantrips,
          (classCantrips) => onChange({ classCantrips }))}
      />
      <MagicInitiateGroups kind="cantrips" {...{ step, composition, onChange }} />
    </div>
  );
}

/** Les sorts de niveau 1, de la classe et du don. */
export function SpellsStepView({ step, composition, onChange }: SpellsStepViewProps) {
  if (step.isLoading) return <Loading />;

  return (
    <div className="grid gap-6">
      <SpellGroup
        title="Sorts préparés"
        spells={step.classSpells?.level1 ?? []}
        limit={step.classSpellsPrepared}
        selection={selectionOf(sourceOf(step, composition), composition.classSpells,
          (classSpells) => onChange({ classSpells }))}
      />
      <SpellGroup
        title="Grimoire — sorts préparés plus tard, sur la fiche"
        spells={step.classSpells?.level1 ?? []}
        limit={step.spellbookSize}
        selection={selectionOf(sourceOf(step, composition), composition.spellbook,
          (spellbook) => onChange({ spellbook }))}
      />
      <MagicInitiateGroups kind="spells" {...{ step, composition, onChange }} />
    </div>
  );
}

function MagicInitiateGroups(props: SpellsStepViewProps & { kind: "cantrips" | "spells" }) {
  return <>{props.composition.magicInitiateChoices.map((choice) => {
    const list = choice.spellList ? props.step.featSpellLists[choice.spellList] : undefined;
    const spells = props.kind === "cantrips"
      ? list?.cantrips ?? []
      : list?.level1 ?? [];
    const selected = props.kind === "cantrips" ? choice.cantrips : choice.spells;
    const limit = props.kind === "cantrips" ? 2 : 1;
    const source = choice.grantedBy.type === "background" ? "Historique" : "Espèce";
    return <SpellGroup key={`${choice.grantedBy.type}:${choice.grantedBy.key}`}
      title={`${props.kind === "cantrips" ? "Sorts mineurs" : "Sort de niveau 1"} — ${source}`}
      spells={spells} limit={limit}
      selection={selectionOf(sourceOf(props.step, props.composition), selected,
        (keys) => updateMagicSpells(props, choice, keys))} />;
  })}</>;
}

function updateMagicSpells(
  props: SpellsStepViewProps & { kind: "cantrips" | "spells" },
  selected: CharacterComposition["magicInitiateChoices"][number],
  keys: string[],
) {
  props.onChange({ magicInitiateChoices: props.composition.magicInitiateChoices.map((choice) =>
    choice.grantedBy.type === selected.grantedBy.type && choice.grantedBy.key === selected.grantedBy.key
      ? { ...choice, [props.kind]: keys }
      : choice),
  });
}

function sourceOf(step: SpellsStep, composition: CharacterComposition): SpellSource {
  return { composition, grantedSpells: step.grantedSpells };
}

function Loading() {
  return <p className="text-sm text-muted-foreground">Chargement des sorts...</p>;
}
