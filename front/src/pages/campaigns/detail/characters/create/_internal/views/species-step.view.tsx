import type { CatalogSpecies, DndCatalog, SkillName } from "@donjon-dragon/shared";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf } from "../types/wizard-draft";
import type { WizardDraft } from "../types/wizard-draft";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

interface SpeciesStepViewProps {
  catalog: DndCatalog;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function SpeciesStepView(props: SpeciesStepViewProps) {
  const { catalog, draft, onChange } = props;
  const species = catalog.species.find((entry) => entry.key === draft.speciesKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.species}
        selectedKey={draft.speciesKey}
        onSelect={(key) =>
          onChange({
            speciesKey: key as CatalogSpecies["key"],
            lineageKey: null,
            speciesSkills: [],
          })
        }
      />
      {species ? <SpeciesDetails {...props} species={species} /> : null}
    </div>
  );
}

interface SpeciesDetailsProps extends SpeciesStepViewProps {
  species: CatalogSpecies;
}

function SpeciesDetails(props: SpeciesDetailsProps) {
  return (
    <div className="grid gap-4">
      <Separator />
      <TraitList species={props.species} />
      <LineageChoice {...props} />
      <SpeciesSkillChoice {...props} />
    </div>
  );
}

function TraitList({ species }: { species: CatalogSpecies }) {
  return (
    <div className="grid gap-1">
      <h3 className="section-title text-sm">Traits</h3>
      {species.traits.map((trait) => (
        <p key={trait.key} className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{trait.name}</span> —{" "}
          {trait.description}
        </p>
      ))}
    </div>
  );
}

function LineageChoice({ species, draft, onChange }: SpeciesDetailsProps) {
  if (!species.lineage) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">{species.lineage.label}</h3>
      <OptionListView
        options={species.lineage.options}
        selectedKey={draft.lineageKey}
        onSelect={(key) => onChange({ lineageKey: key })}
      />
    </div>
  );
}

function SpeciesSkillChoice({ catalog, species, draft, onChange }: SpeciesDetailsProps) {
  if (!species.skillChoice) return null;
  const { count, options } = species.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: draft.speciesSkills,
        labels: catalog.skillLabels,
        alreadyKnown: draft.classSkills,
        onChange: (speciesSkills: SkillName[]) => onChange({ speciesSkills }),
      }}
    />
  );
}
