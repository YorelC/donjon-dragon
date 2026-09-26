import type {
  CatalogSpecies,
  DndCatalog,
  SkillName,
} from "@donjon-dragon/shared";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { knownSkillsExcept } from "../types/builder-lookups";
import { defaultMeasurementsOf } from "../types/identity-fields";
import { withoutFeatTools } from "../types/builder-transitions";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

interface SpeciesStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/** Le lignage a son propre écran : il n'apparaît que pour cinq espèces sur neuf. */
export function SpeciesStepView(props: SpeciesStepViewProps) {
  const { catalog, composition } = props;
  const species = catalog.species.find((entry) => entry.key === composition.speciesKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.species}
        selectedKey={composition.speciesKey}
        onSelect={(key) => selectSpecies(props, key)}
      />
      {species ? <SpeciesDetails {...props} species={species} /> : null}
    </div>
  );
}

function selectSpecies({ catalog, composition, onChange }: SpeciesStepViewProps, key: string) {
  const species = catalog.species.find((entry) => entry.key === key);
  if (species) onChange(speciesChangePatch(species, composition));
}

/**
 * Changer d'espèce périme tout ce que l'espèce portait.
 *
 * Le lignage et ses compétences sautent toujours ; taille et poids reprennent la
 * valeur par défaut de la nouvelle espèce (DEC-008). Le don d'origine
 * est le plus vicieux : seul l'humain en fait choisir un, donc l'étape des dons
 * ne l'affiche plus une fois l'espèce changée. Survivant, il part au serveur au
 * nom de la nouvelle espèce, qui le refuse — et aucun écran ne permet de le
 * retirer. Le wizard devient alors impossible à terminer.
 */
function speciesChangePatch(
  species: CatalogSpecies,
  composition: CharacterComposition,
): Partial<CharacterComposition> {
  return {
    speciesKey: species.key,
    lineageKey: null,
    lineageSpellcastingAbility: null,
    speciesSkills: [],
    speciesFeat: null,
    ...defaultMeasurementsOf(species.physicalBounds),
    ...orphanedFeatChoices(composition),
  };
}

/**
 * Les choix qu'un don a fait faire — compétences, outils, liste de sorts — sont
 * Les anciens champs à plat sont remis à zéro pour la compatibilité des builds
 * existants. Les choix sourcés permettent désormais de ne retirer que celui de
 * l'espèce ; l'occurrence accordée par l'historique reste intacte.
 */
function orphanedFeatChoices(
  composition: CharacterComposition,
): Partial<CharacterComposition> {
  if (!composition.speciesFeat) return {};

  return {
    featSkills: [],
    featTools: [],
    spellcastingAbility: null,
    spellList: null,
    featCantrips: [],
    featSpells: [],
    magicInitiateChoices: composition.magicInitiateChoices.filter(
      (choice) => choice.grantedBy.type !== "species",
    ),
    featToolChoices: withoutFeatTools(composition, composition.speciesFeat),
  };
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
