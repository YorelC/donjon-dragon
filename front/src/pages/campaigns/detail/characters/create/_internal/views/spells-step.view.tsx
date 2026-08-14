import type { CatalogSpell, CatalogSpellList } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import type { WizardDraft } from "../types/wizard-draft";

export interface SpellsStep {
  classSpells: CatalogSpellList | null;
  classCantripsKnown: number;
  classSpellsPrepared: number;
  /** La liste d'Initié à la magie, quand un don en accorde une. */
  featSpells: CatalogSpellList | null;
  featCantripsKnown: number;
  featSpellsPrepared: number;
  isLoading: boolean;
}

interface SpellsStepViewProps {
  step: SpellsStep;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

/** Les sorts mineurs, de la classe et du don, sur le même écran. */
export function CantripsStepView({ step, draft, onChange }: SpellsStepViewProps) {
  if (step.isLoading) return <Loading />;

  return (
    <div className="grid gap-6">
      <SpellGroup
        title="Sorts mineurs de classe"
        spells={step.classSpells?.cantrips ?? []}
        limit={step.classCantripsKnown}
        selected={draft.classCantrips}
        onChange={(classCantrips) => onChange({ classCantrips })}
      />
      <SpellGroup
        title="Sorts mineurs — Initié à la magie"
        spells={step.featSpells?.cantrips ?? []}
        limit={step.featCantripsKnown}
        selected={draft.featCantrips}
        onChange={(featCantrips) => onChange({ featCantrips })}
      />
    </div>
  );
}

/** Les sorts de niveau 1, de la classe et du don. */
export function SpellsStepView({ step, draft, onChange }: SpellsStepViewProps) {
  if (step.isLoading) return <Loading />;

  return (
    <div className="grid gap-6">
      <SpellGroup
        title="Sorts préparés"
        spells={step.classSpells?.level1 ?? []}
        limit={step.classSpellsPrepared}
        selected={draft.classSpells}
        onChange={(classSpells) => onChange({ classSpells })}
      />
      <SpellGroup
        title="Sort de niveau 1 — Initié à la magie"
        spells={step.featSpells?.level1 ?? []}
        limit={step.featSpellsPrepared}
        selected={draft.featSpells}
        onChange={(featSpells) => onChange({ featSpells })}
      />
    </div>
  );
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

function SpellGroup({ title, spells, limit, selected, onChange }: SpellGroupProps) {
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
