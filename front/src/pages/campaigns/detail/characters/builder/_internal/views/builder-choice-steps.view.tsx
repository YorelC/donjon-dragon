import { ChoiceStepView } from "./choice-step.view";
import type { BuilderScreen } from "./character-builder.view";

export function LineageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder } = screen;
  const lineage = catalog.species.find(
    (entry) => entry.key === builder.composition.speciesKey,
  )?.lineage;
  if (!lineage) return null;

  return (
    <ChoiceStepView
      title={lineage.label}
      description="Ce choix vous confère des pouvoirs surnaturels propres à votre lignée."
      options={lineage.options}
      selectedKey={builder.composition.lineageKey}
      onSelect={(lineageKey) => builder.update({ lineageKey })}
    />
  );
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
