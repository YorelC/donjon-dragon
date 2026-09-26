import type { CatalogSpell, CatalogSpellList, ClassKey } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import type { CharacterComposition } from "../types/character-composition";

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
        selected={composition.classCantrips}
        onChange={(classCantrips) => onChange({ classCantrips })}
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
        spells={withoutInvocationSpells(step.classSpells?.level1 ?? [], composition)}
        limit={step.classSpellsPrepared}
        selected={composition.classSpells}
        onChange={(classSpells) => onChange({ classSpells })}
      />
      <SpellGroup
        title="Grimoire — sorts préparés plus tard, sur la fiche"
        spells={step.classSpells?.level1 ?? []}
        limit={step.spellbookSize}
        selected={composition.spellbook}
        onChange={(spellbook) => onChange({ spellbook })}
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
      : withoutInvocationSpells(list?.level1 ?? [], props.composition);
    const selected = props.kind === "cantrips" ? choice.cantrips : choice.spells;
    const limit = props.kind === "cantrips" ? 2 : 1;
    const source = choice.grantedBy.type === "background" ? "Historique" : "Espèce";
    return <SpellGroup key={`${choice.grantedBy.type}:${choice.grantedBy.key}`}
      title={`${props.kind === "cantrips" ? "Sorts mineurs" : "Sort de niveau 1"} — ${source}`}
      spells={spells} limit={limit} selected={selected}
      onChange={(keys) => updateMagicSpells(props, choice, keys)} />;
  })}</>;
}

function withoutInvocationSpells(spells: readonly CatalogSpell[], composition: CharacterComposition) {
  return spells.filter((spell) => !composition.invocationSpells.includes(spell.key));
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

function Loading() {
  return <p className="text-sm text-muted-foreground">Chargement des sorts...</p>;
}

interface SpellGroupProps {
  title: string;
  spells: readonly CatalogSpell[];
  limit: number;
  selected: readonly string[];
  onChange: (keys: string[]) => void;
}

export function SpellGroup({ title, spells, limit, selected, onChange }: SpellGroupProps) {
  if (limit === 0 || spells.length === 0) return null;
  const chosen = spells.filter((spell) => selected.includes(spell.key));

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">
        {title} <Badge variant="outline">{chosen.length} / {limit}</Badge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {spells.map((spell) => (
          <SpellToggle
            key={spell.key}
            spell={spell}
            full={chosen.length >= limit}
            selected={selected}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

interface SpellToggleProps {
  spell: CatalogSpell;
  full: boolean;
  selected: readonly string[];
  onChange: (keys: string[]) => void;
}

function SpellToggle({ spell, full, selected, onChange }: SpellToggleProps) {
  const chosen = selected.includes(spell.key);

  return (
    <Button
      type="button"
      size="sm"
      variant={chosen ? "default" : "outline"}
      disabled={full && !chosen}
      title={spell.description}
      onClick={() => onChange(toggle(selected, spell.key))}
    >
      {spell.name}
    </Button>
  );
}

function toggle(selected: readonly string[], key: string): string[] {
  return selected.includes(key)
    ? selected.filter((entry) => entry !== key)
    : [...selected, key];
}
