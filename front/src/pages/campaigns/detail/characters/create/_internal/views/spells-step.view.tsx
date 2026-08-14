import type { CatalogSpell, CatalogSpellList } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import type { WizardDraft } from "../types/wizard-draft";

export interface SpellsStep {
  spells: CatalogSpellList | null;
  cantripsKnown: number;
  spellsPrepared: number;
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
        draft={draft}
        onChange={onChange}
      />
      <SpellGroup
        title="Sorts de niveau 1"
        spells={step.spells.level1}
        limit={step.spellsPrepared}
        draft={draft}
        onChange={onChange}
      />
    </div>
  );
}

interface SpellGroupProps {
  title: string;
  spells: readonly CatalogSpell[];
  limit: number;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

function SpellGroup({ title, spells, limit, draft, onChange }: SpellGroupProps) {
  if (limit === 0) return null;
  const chosen = spells.filter((spell) => draft.spells.includes(spell.key));

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
            draft={draft}
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
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

function SpellToggle({ spell, full, draft, onChange }: SpellToggleProps) {
  const chosen = draft.spells.includes(spell.key);

  return (
    <Button
      type="button"
      size="sm"
      variant={chosen ? "default" : "outline"}
      disabled={full && !chosen}
      title={spell.description}
      onClick={() => onChange({ spells: toggle(draft.spells, spell.key) })}
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
