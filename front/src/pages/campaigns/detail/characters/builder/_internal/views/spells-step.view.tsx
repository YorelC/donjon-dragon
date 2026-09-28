import type { CatalogSpell, CatalogSpellList, ClassKey } from "@donjon-dragon/shared";
import type { CharacterComposition } from "../types/character-composition";
import type { SpellGrant } from "../types/chosen-spells";
import {
  magicInitiateGroupOf,
  magicInitiateTitleOf,
  SPELL_GROUPS,
  type NamedSpellSource,
  type OwnSpells,
} from "../types/spell-origins";
import type { StepBinding } from "../types/step-binding";
import { SpellGroup, previewing, selectionOf } from "./spell-group.view";

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
  /** Les mêmes octrois, sous le nom de ce qui les accorde. */
  grantedBy: SpellGrant[];
  tomeSpells: { cantrips: CatalogSpell[]; rituals: CatalogSpell[] };
  isLoading: boolean;
}

interface SpellsStepViewProps {
  spells: SpellsStep;
  binding: StepBinding;
}

type SpellKind = "cantrips" | "spells";

const MAGIC_INITIATE_QUOTAS: Record<SpellKind, number> = { cantrips: 2, spells: 1 };

/** Les sorts mineurs, de la classe et du don, sur le même écran. */
export function CantripsStepView({ spells, binding }: SpellsStepViewProps) {
  if (spells.isLoading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <SpellGroup
        title={SPELL_GROUPS.classCantrips}
        spells={spells.classSpells?.cantrips ?? []}
        limit={spells.classCantripsKnown}
        selection={selectionFor({ spells, binding },
          { group: "classCantrips", keys: binding.composition.classCantrips },
          (classCantrips) => binding.onChange({ classCantrips }))}
      />
      <MagicInitiateGroups kind="cantrips" spells={spells} binding={binding} />
    </div>
  );
}

/** Les sorts de niveau 1, de la classe et du don. */
export function SpellsStepView({ spells, binding }: SpellsStepViewProps) {
  if (spells.isLoading) return <Loading />;
  const levelOne = spells.classSpells?.level1 ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SpellGroup
        title={SPELL_GROUPS.classSpells}
        spells={levelOne}
        limit={spells.classSpellsPrepared}
        selection={selectionFor({ spells, binding },
          { group: "classSpells", keys: binding.composition.classSpells },
          (classSpells) => binding.onChange({ classSpells }))}
      />
      <SpellGroup
        title="Grimoire — sorts préparés plus tard, sur la fiche"
        spells={levelOne}
        limit={spells.spellbookSize}
        selection={selectionFor({ spells, binding },
          { group: "spellbook", keys: binding.composition.spellbook },
          (spellbook) => binding.onChange({ spellbook }))}
      />
      <MagicInitiateGroups kind="spells" spells={spells} binding={binding} />
    </div>
  );
}

type MagicInitiateChoice = CharacterComposition["magicInitiateChoices"][number];

interface MagicInitiateGroupsProps extends SpellsStepViewProps {
  kind: SpellKind;
}

function MagicInitiateGroups(props: MagicInitiateGroupsProps) {
  return (
    <>
      {props.binding.composition.magicInitiateChoices.map((choice) => (
        <MagicInitiateGroup
          key={`${choice.grantedBy.type}:${choice.grantedBy.key}`}
          group={props}
          choice={choice}
        />
      ))}
    </>
  );
}

function MagicInitiateGroup({ group, choice }: { group: MagicInitiateGroupsProps; choice: MagicInitiateChoice }) {
  const list = choice.spellList ? group.spells.featSpellLists[choice.spellList] : undefined;
  const spells = group.kind === "cantrips" ? list?.cantrips ?? [] : list?.level1 ?? [];
  const own = { group: magicInitiateGroupOf(choice, group.kind), keys: choice[group.kind] };

  return (
    <SpellGroup
      title={magicInitiateTitleOf(choice, group.kind)}
      spells={spells}
      limit={MAGIC_INITIATE_QUOTAS[group.kind]}
      selection={selectionFor(group, own, (keys) => updateMagicSpells(group, choice, keys))}
    />
  );
}

function updateMagicSpells(group: MagicInitiateGroupsProps, selected: MagicInitiateChoice, keys: string[]) {
  const { composition, onChange } = group.binding;
  onChange({
    magicInitiateChoices: composition.magicInitiateChoices.map((choice) =>
      choice.grantedBy.type === selected.grantedBy.type && choice.grantedBy.key === selected.grantedBy.key
        ? { ...choice, [group.kind]: keys }
        : choice),
  });
}

function selectionFor(
  { spells, binding }: SpellsStepViewProps,
  own: OwnSpells,
  onChange: (keys: string[]) => void,
) {
  const source: NamedSpellSource = {
    composition: binding.composition,
    grantedSpells: spells.grantedSpells,
    grantedBy: spells.grantedBy,
  };

  return previewing(selectionOf(source, own, onChange), binding.preview);
}

function Loading() {
  return <p className="empty-state-text">Chargement des sorts...</p>;
}
