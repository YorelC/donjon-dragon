import type {
  ComputedCharacter,
  ResolvedFeature,
  ResolvedSpell,
  ResolvedSpellcasting,
} from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { formatValue } from "./character-vitals.view";

const APPLICATION_LABELS: Record<string, string> = {
  passive: "Passif",
  grant: "Octroi",
  reactive: "Réaction",
  active: "Action",
  informational: "Rappel",
};

interface CharacterFeaturesViewProps {
  sheet: ComputedCharacter;
}

export function CharacterFeaturesView({ sheet }: CharacterFeaturesViewProps) {
  return (
    <div className="grid gap-6">
      <SpellcastingBlock sheet={sheet} />
      <ResourceBlock sheet={sheet} />
      <FeatureBlock sheet={sheet} />
    </div>
  );
}

function SpellcastingBlock({ sheet }: CharacterFeaturesViewProps) {
  if (sheet.spellcasting.length === 0) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Incantation</h3>
      {sheet.spellcasting.map((entry) => (
        <SpellcastingRow key={entry.origin} entry={entry} />
      ))}
    </div>
  );
}

function SpellcastingRow({ entry }: { entry: ResolvedSpellcasting }) {
  return (
    <div className="grid gap-1">
      <p className="text-sm">
        <span className="font-medium">{entry.origin}</span> — DD {entry.saveDc}, attaque{" "}
        {formatValue(entry.attackBonus, true)}
        {entry.level1Slots > 0
          ? `, ${entry.level1Slots} emplacement${entry.level1Slots > 1 ? "s" : ""} de niveau 1`
          : ""}
        {entry.slotsRecoverOnShortRest ? " (repos court)" : ""}
      </p>
      <SpellList label="Sorts mineurs" spells={entry.cantripsKnown} />
      <SpellList label="Sorts préparés" spells={entry.spellsPrepared} />
    </div>
  );
}

interface SpellListProps {
  label: string;
  spells: ResolvedSpell[];
}

function SpellList({ label, spells }: SpellListProps) {
  if (spells.length === 0) return null;

  return (
    <p className="text-sm text-muted-foreground">
      {label} : {spells.map((spell) => spell.name).join(", ")}
    </p>
  );
}

function ResourceBlock({ sheet }: CharacterFeaturesViewProps) {
  if (sheet.resources.length === 0) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Ressources</h3>
      <div className="flex flex-wrap gap-2">
        {sheet.resources.map((resource) => (
          <Badge key={resource.key} variant="outline">
            {resource.feature} : {resource.max}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/**
 * Toutes les capacités, y compris celles qui n'accordent qu'une maîtrise : les
 * filtrer rendait Doué — le don du noble — totalement invisible.
 */
function FeatureBlock({ sheet }: CharacterFeaturesViewProps) {
  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Capacités</h3>
      {sheet.features.map((feature, index) => (
        <FeatureRow key={`${feature.source}-${feature.name}-${index}`} feature={feature} />
      ))}
    </div>
  );
}

function FeatureRow({ feature }: { feature: ResolvedFeature }) {
  return (
    <p className="text-sm">
      {uniqueApplications(feature).map((application) => (
        <Badge key={application} variant="secondary" className="mr-2">
          {APPLICATION_LABELS[application] ?? application}
        </Badge>
      ))}
      <span className="font-medium">{feature.name}</span>
      <span className="text-muted-foreground"> ({feature.source})</span>
      {feature.notes.map((note) => (
        <span key={note} className="block text-muted-foreground">
          {note}
        </span>
      ))}
    </p>
  );
}

function uniqueApplications(feature: ResolvedFeature): string[] {
  return [...new Set(feature.applications)];
}
