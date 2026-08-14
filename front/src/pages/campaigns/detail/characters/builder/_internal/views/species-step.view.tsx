import type { CatalogSpecies, DndCatalog, SkillName } from "@donjon-dragon/shared";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf, type CharacterDraft } from "../types/character-draft";
import { knownSkillsExcept } from "../types/builder-lookups";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

interface SpeciesStepViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
}

/** Le lignage a son propre écran : il n'apparaît que pour cinq espèces sur neuf. */
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
        alreadyKnown: knownSkillsExcept({ catalog, draft }, "species"),
        onChange: (speciesSkills: SkillName[]) => onChange({ speciesSkills }),
      }}
    />
  );
}
