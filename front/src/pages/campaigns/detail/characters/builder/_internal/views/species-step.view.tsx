import type { CatalogSpecies, SkillName } from "@donjon-dragon/shared";
import { skillAbilityNamesOf } from "../types/ability-hints";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { knownSkillsExcept } from "../types/builder-lookups";
import { defaultMeasurementsOf } from "../types/identity-fields";
import { withoutFeatTools } from "../types/builder-transitions";
import type { StepBinding } from "../types/step-binding";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

/**
 * Les espèces en vignettes ; leurs traits se lisent dans la fiche détaillée. Le
 * lignage a son propre écran : il n'apparaît que pour cinq espèces sur neuf.
 */
export function SpeciesStepView({ binding }: { binding: StepBinding }) {
  const species = binding.catalog.species.find((entry) => entry.key === binding.composition.speciesKey);

  return (
    <div className="flex flex-col gap-5">
      <OptionListView
        list={{
          options: binding.catalog.species,
          selectedKey: binding.composition.speciesKey,
          onSelect: (key) => selectSpecies(binding, key),
          onPreview: binding.preview,
        }}
      />
      {species ? <SpeciesSkillChoice binding={binding} species={species} /> : null}
    </div>
  );
}

function selectSpecies({ catalog, composition, onChange }: StepBinding, key: string) {
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

interface SpeciesSkillChoiceProps {
  binding: StepBinding;
  species: CatalogSpecies;
}

function SpeciesSkillChoice({ binding, species }: SpeciesSkillChoiceProps) {
  if (!species.skillChoice) return null;
  const { count, options } = species.skillChoice;
  const { catalog, composition, onChange } = binding;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: composition.speciesSkills,
        labels: catalog.skillLabels,
        abilities: skillAbilityNamesOf(catalog),
        alreadyKnown: knownSkillsExcept(binding, "species"),
        onChange: (speciesSkills: SkillName[]) => onChange({ speciesSkills }),
        onPreview: binding.preview,
      }}
    />
  );
}
