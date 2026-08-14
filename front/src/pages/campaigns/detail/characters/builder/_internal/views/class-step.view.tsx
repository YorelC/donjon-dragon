import type { CatalogClass, ClassKey, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Separator } from "@/shared/components/atoms/separator";
import type { CharacterDraft } from "../types/character-draft";
import { OptionListView } from "./option-list.view";

interface ClassStepViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
}

/**
 * Le choix de la classe seul. Ses compétences, son expertise, son Style de
 * combat et son Ordre ont chacun leur écran : ce sont des décisions distinctes,
 * et le fil conducteur doit les montrer comme telles.
 */
export function ClassStepView({ catalog, draft, onChange }: ClassStepViewProps) {
  const characterClass = catalog.classes.find((entry) => entry.key === draft.classKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.classes.map((entry) => ({ key: entry.key, name: entry.name }))}
        selectedKey={draft.classKey}
        onSelect={(key) =>
          onChange({
            classKey: key as ClassKey,
            classSkills: [],
            expertise: [],
            classCantrips: [],
            classSpells: [],
            fightingStyle: null,
            classOrder: null,
          })
        }
      />
      {characterClass ? <ClassDetails characterClass={characterClass} /> : null}
    </div>
  );
}

function ClassDetails({ characterClass }: { characterClass: CatalogClass }) {
  return (
    <div className="grid gap-4">
      <Separator />
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="outline">Dé de vie d{characterClass.hitDie}</Badge>
        <Badge variant="outline">
          Sauvegardes : {characterClass.savingThrows.join(", ")}
        </Badge>
        {characterClass.spellcasting ? (
          <Badge>Incantation ({characterClass.spellcasting.ability})</Badge>
        ) : null}
      </div>
      <FeatureList characterClass={characterClass} />
    </div>
  );
}

function FeatureList({ characterClass }: { characterClass: CatalogClass }) {
  return (
    <div className="grid gap-1">
      <h3 className="section-title text-sm">Capacités de niveau 1</h3>
      {characterClass.level1Features.map((feature) => (
        <p key={feature.key} className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{feature.name}</span> —{" "}
          {feature.description}
        </p>
      ))}
    </div>
  );
}
