import type { Ability, CatalogLineageChoice } from "@donjon-dragon/shared";
import { ABILITY_LABELS } from "../types/character-composition";
import { ChoiceStepView } from "./choice-step.view";
import type { BuilderScreen } from "./character-builder.view";

export function LineageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder } = screen;
  const lineage = catalog.species.find(
    (entry) => entry.key === builder.composition.speciesKey,
  )?.lineage;
  if (!lineage) return null;

  return (
    <div className="grid gap-6">
      <ChoiceStepView
        title={lineage.label}
        description="Ce choix vous confère des pouvoirs surnaturels propres à votre lignée."
        options={lineage.options}
        selectedKey={builder.composition.lineageKey}
        onSelect={(lineageKey) => builder.update({ lineageKey })}
      />
      <LineageSpellcastingAbilityChoice lineage={lineage} screen={screen} />
    </div>
  );
}

interface LineageAbilityProps {
  lineage: CatalogLineageChoice;
  screen: BuilderScreen;
}

/**
 * Le sort mineur de la lignée a besoin d'une caractéristique d'incantation, que
 * le manuel fait choisir à la création. Sans elle, ni son DD ni son bonus
 * d'attaque ne sont calculables.
 */
function LineageSpellcastingAbilityChoice({ lineage, screen }: LineageAbilityProps) {
  const options = lineage.spellcastingAbilityOptions;
  if (!options?.length) return null;

  return (
    <ChoiceStepView
      title="Caractéristique d’incantation"
      description="Elle détermine le degré de difficulté et le bonus d’attaque du sort mineur de votre lignée."
      options={options.map(toAbilityOption)}
      selectedKey={screen.builder.composition.lineageSpellcastingAbility}
      onSelect={(key) =>
        screen.builder.update({ lineageSpellcastingAbility: key as Ability })
      }
    />
  );
}

function toAbilityOption(ability: Ability) {
  return { key: ability, name: ABILITY_LABELS[ability], description: "" };
}

interface ClassChoiceStepProps {
  screen: BuilderScreen;
  choiceKey: "fightingStyle" | "order";
}

/** Style de combat et Ordre partagent la même forme : un choix parmi une liste. */
export function ClassChoiceStep({ screen, choiceKey }: ClassChoiceStepProps) {
  const { catalog, builder } = screen;
  const choices = catalog.classes.find((entry) => entry.key === builder.composition.classKey)
    ?.level1Choices;
  const choice = choices?.find((entry) =>
    choiceKey === "fightingStyle"
      ? entry.key === "fightingStyle"
      : entry.key !== "fightingStyle",
  );
  if (!choice) return null;

  const selected =
    choiceKey === "fightingStyle"
      ? builder.composition.fightingStyle
      : builder.composition.classOrder;

  return (
    <ChoiceStepView
      title={choice.name}
      description={choice.description}
      options={choice.options}
      selectedKey={selected}
      onSelect={(key) =>
        builder.update(
          choiceKey === "fightingStyle" ? { fightingStyle: key } : { classOrder: key },
        )
      }
    />
  );
}
