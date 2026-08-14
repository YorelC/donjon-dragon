import type {
  ComputedCharacter,
  ResolvedFeature,
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
    <p className="text-sm">
      <span className="font-medium">{entry.origin}</span> — DD {entry.saveDc}, attaque{" "}
      {formatValue(entry.attackBonus, true)}
      {entry.level1Slots > 0
        ? `, ${entry.level1Slots} emplacement${entry.level1Slots > 1 ? "s" : ""} de niveau 1`
        : ""}
      {entry.slotsRecoverOnShortRest ? " (repos court)" : ""}
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

function FeatureBlock({ sheet }: CharacterFeaturesViewProps) {
  const displayed = sheet.features.filter((feature) => feature.application !== "grant");

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Capacités</h3>
      {displayed.map((feature, index) => (
        <FeatureRow key={`${feature.name}-${index}`} feature={feature} />
      ))}
    </div>
  );
}

function FeatureRow({ feature }: { feature: ResolvedFeature }) {
  return (
    <p className="text-sm">
      <Badge variant="secondary" className="mr-2">
        {APPLICATION_LABELS[feature.application] ?? feature.application}
      </Badge>
      <span className="font-medium">{feature.name}</span>
      <span className="text-muted-foreground"> ({feature.source})</span>
      {feature.note ? (
        <span className="block text-muted-foreground">{feature.note}</span>
      ) : null}
    </p>
  );
}
