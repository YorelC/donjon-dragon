import type { CatalogSpecies, DndCatalog, SkillName } from "@donjon-dragon/shared";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { knownSkillsExcept } from "../types/builder-lookups";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

interface SpeciesStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/** Le lignage a son propre écran : il n'apparaît que pour cinq espèces sur neuf. */
export function SpeciesStepView(props: SpeciesStepViewProps) {
  const { catalog, composition, onChange } = props;
  const species = catalog.species.find((entry) => entry.key === composition.speciesKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.species}
        selectedKey={composition.speciesKey}
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

function SpeciesSkillChoice({ catalog, species, composition, onChange }: SpeciesDetailsProps) {
  if (!species.skillChoice) return null;
  const { count, options } = species.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: composition.speciesSkills,
        labels: catalog.skillLabels,
        alreadyKnown: knownSkillsExcept({ catalog, composition }, "species"),
        onChange: (speciesSkills: SkillName[]) => onChange({ speciesSkills }),
      }}
    />
  );
}
