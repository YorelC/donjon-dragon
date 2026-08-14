import type { CatalogSpell, CatalogSpellList } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import type { WizardDraft } from "../types/wizard-draft";

export interface SpellsStep {
  spells: CatalogSpellList | null;
  cantripsKnown: number;
  spellsPrepared: number;
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

export function SpellsStepView({ step, draft, onChange }: SpellsStepViewProps) {
  if (step.isLoading || !step.spells) {
    return <p className="text-sm text-muted-foreground">Chargement des sorts...</p>;
  }

  return (
    <div className="grid gap-6">
      <SpellGroup
        title="Sorts mineurs"
        spells={step.spells.cantrips}
        limit={step.cantripsKnown}
        selected={draft.classSpells}
        onChange={(classSpells) => onChange({ classSpells })}
      />
      <SpellGroup
        title="Sorts de niveau 1"
        spells={step.spells.level1}
        limit={step.spellsPrepared}
        selected={draft.classSpells}
        onChange={(classSpells) => onChange({ classSpells })}
      />
      <FeatSpells step={step} draft={draft} onChange={onChange} />
    </div>
  );
}

/** Initié à la magie puise dans sa propre liste, avec son propre compte. */
function FeatSpells({ step, draft, onChange }: SpellsStepViewProps) {
  if (!step.featSpells || step.featCantripsKnown + step.featSpellsPrepared === 0) return null;

  return (
    <>
      <SpellGroup
        title="Sorts mineurs — Initié à la magie"
        spells={step.featSpells.cantrips}
        limit={step.featCantripsKnown}
        selected={draft.featSpells}
        onChange={(featSpells) => onChange({ featSpells })}
      />
      <SpellGroup
        title="Sort de niveau 1 — Initié à la magie"
        spells={step.featSpells.level1}
        limit={step.featSpellsPrepared}
        selected={draft.featSpells}
        onChange={(featSpells) => onChange({ featSpells })}
      />
    </>
  );
}

interface SpellGroupProps {
  title: string;
  spells: readonly CatalogSpell[];
  limit: number;
  selected: readonly string[];
  onChange: (keys: string[]) => void;
}

function SpellGroup({ title, spells, limit, selected, onChange }: SpellGroupProps) {
  if (limit === 0) return null;
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
