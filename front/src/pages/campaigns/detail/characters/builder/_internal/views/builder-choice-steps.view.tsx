import type { Ability, CatalogLineageChoice } from "@donjon-dragon/shared";
import { fightingStyleChoiceOf, orderChoiceOf } from "../types/builder-lookups";
import { ABILITY_LABELS } from "../types/character-composition";
import { ChoiceStepView } from "./choice-step.view";
import type { BuilderScreen } from "./character-builder.view";

export function LineageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder, focus } = screen;
  const lineage = catalog.species.find(
    (entry) => entry.key === builder.composition.speciesKey,
  )?.lineage;
  if (!lineage) return null;

  return (
    <div className="flex flex-col gap-6">
      <ChoiceStepView
        choice={{
          title: lineage.label,
          options: lineage.options,
          selectedKey: builder.composition.lineageKey,
          onSelect: (lineageKey) => builder.update({ lineageKey }),
          onPreview: focus.show,
        }}
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
      choice={{
        title: "Caractéristique d’incantation",
        options: options.map(toAbilityOption),
        selectedKey: screen.builder.composition.lineageSpellcastingAbility,
        onSelect: (key) => screen.builder.update({ lineageSpellcastingAbility: key as Ability }),
        look: "plain",
      }}
    />
  );
}

function toAbilityOption(ability: Ability) {
  return { key: ability, name: ABILITY_LABELS[ability] };
}

interface ClassChoiceStepProps {
  screen: BuilderScreen;
  choiceKey: "fightingStyle" | "order";
}

/** Style de combat et Ordre partagent la même forme : un choix parmi une liste. */
export function ClassChoiceStep({ screen, choiceKey }: ClassChoiceStepProps) {
  const { builder, focus } = screen;
  const choice = choiceKey === "fightingStyle"
    ? fightingStyleChoiceOf(screen.context)
    : orderChoiceOf(screen.context);
  if (!choice) return null;

  return (
    <ChoiceStepView
      choice={{
        title: choice.name,
        options: choice.options,
        selectedKey: choiceKey === "fightingStyle" ? builder.composition.fightingStyle : builder.composition.classOrder,
        onSelect: (key) =>
          builder.update(choiceKey === "fightingStyle" ? { fightingStyle: key } : { classOrder: key }),
        onPreview: focus.show,
      }}
    />
  );
}
