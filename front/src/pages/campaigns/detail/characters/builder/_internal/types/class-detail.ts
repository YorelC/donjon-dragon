import type { CatalogClass, CatalogClassChoice, DndCatalog } from "@donjon-dragon/shared";
import {
  ARMOR_TRAINING_LABELS,
  WEAPON_PROFICIENCY_LABELS,
} from "@/shared/constants/character-labels";
import { fightingStyleChoiceOf, orderChoiceOf, type StepContext } from "./builder-lookups";
import { ABILITY_LABELS, allSkillsOf, type CharacterComposition } from "./character-composition";
import {
  describedBlock,
  itemsBlock,
  labelsOf,
  plainDetail,
  presentBlocks,
  proseBlock,
  shownKey,
  type DetailBlock,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const NONE = "Aucune";

/** La classe survolée ou retenue : dé de vie, maîtrises, aptitudes, paquetage. */
export function classDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const key = shownKey(source, composition.classKey);
  const characterClass = catalog.classes.find((entry) => entry.key === key);
  if (!characterClass) return plainDetail("Classe", "Choisissez une classe");

  return {
    kicker: "Classe",
    title: characterClass.name,
    lede: characterClass.description || null,
    badges: [
      { label: "Dé de vie", value: `d${characterClass.hitDie}` },
      { label: "Caractéristiques", value: labelsOf(characterClass.primaryAbilities, ABILITY_LABELS) },
      { label: "Sauvegardes", value: labelsOf(characterClass.savingThrows, ABILITY_LABELS) },
    ],
    blocks: classBlocks(catalog, characterClass),
  };
}

function classBlocks(catalog: DndCatalog, characterClass: CatalogClass): DetailBlock[] {
  return presentBlocks([
    describedBlock("Aptitudes de niveau 1", characterClass.level1Features),
    masteriesBlock(catalog, characterClass),
    spellcastingBlock(characterClass),
    describedBlock("Équipement de départ", characterClass.startingEquipment.options.map((option) => ({
      name: `Option ${option.id}`,
      description: option.label,
    }))),
  ]);
}

function masteriesBlock(catalog: DndCatalog, characterClass: CatalogClass): DetailBlock {
  const { count, options } = characterClass.skillChoice;
  const skills = options === "any" ? allSkillsOf(catalog) : options;
  const weapons = characterClass.weaponProficiencies.map((weapon) => `armes ${WEAPON_PROFICIENCY_LABELS[weapon]}`);
  const armors = characterClass.armorTraining.map((armor) => ARMOR_TRAINING_LABELS[armor]);

  return itemsBlock("Maîtrises", [
    { name: "Armes", text: weapons.join(", ") || NONE },
    { name: "Armures", text: armors.join(", ") || NONE },
    { name: "Outils", text: labelsOf(characterClass.toolProficiencies, catalog.toolLabels) || NONE },
    { name: "Compétences", text: `${count} au choix parmi ${labelsOf(skills, catalog.skillLabels)}` },
  ]);
}

function spellcastingBlock(characterClass: CatalogClass): DetailBlock | null {
  const casting = characterClass.spellcasting;
  if (!casting) return null;

  return itemsBlock("Incantation", [
    { name: "Caractéristique", text: ABILITY_LABELS[casting.ability] },
    {
      name: "Au niveau 1",
      text: `${casting.cantripsKnown} sorts mineurs · ${casting.spellsPrepared} sorts préparés · ${casting.level1Slots} emplacements`,
    },
    { name: "Focaliseur", text: casting.focus },
  ]);
}

interface ClassChoiceReader {
  choiceOf: (context: StepContext) => CatalogClassChoice | undefined;
  retainedOf: (composition: CharacterComposition) => string | null;
}

/** Style de combat ou Ordre : l'option survolée ou retenue, sinon le choix lui-même. */
function classChoiceDetail({ choiceOf, retainedOf }: ClassChoiceReader) {
  return (source: DetailSource): StepDetail => {
    const choice = choiceOf(source.context);
    if (!choice) return plainDetail("Classe", "Aucun choix à faire");
    const key = shownKey(source, retainedOf(source.context.composition));
    const option = choice.options.find((entry) => entry.key === key);
    if (option) {
      return {
        ...plainDetail(choice.name, option.name, option.description),
        blocks: [proseBlock(choice.name, choice.description)],
      };
    }

    return {
      ...plainDetail("Classe", choice.name, choice.description),
      blocks: presentBlocks([describedBlock("Options", choice.options)]),
    };
  };
}

export const fightingStyleDetail = classChoiceDetail({
  choiceOf: fightingStyleChoiceOf,
  retainedOf: (composition) => composition.fightingStyle,
});

export const classOrderDetail = classChoiceDetail({
  choiceOf: orderChoiceOf,
  retainedOf: (composition) => composition.classOrder,
});
