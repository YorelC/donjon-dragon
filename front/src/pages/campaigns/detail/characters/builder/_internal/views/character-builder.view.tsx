import type { ReactElement } from "react";
import type { ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { BuilderState } from "../hooks/use-character-builder";
import { stepLabel, type BuilderStep } from "../types/builder-steps";
import type { AbilitiesStep } from "./abilities-step.view";
import { AbilitiesStepView } from "./abilities-step.view";
import { BackgroundStepView } from "./background-step.view";
import { ChoiceStepView } from "./choice-step.view";
import { ClassStepView } from "./class-step.view";
import { EquipmentStepView } from "./equipment-step.view";
import { FeatsStepView } from "./feats-step.view";
import { ClassSkillsStepView, ExpertiseStepView } from "./skill-choice-step.view";
import { SpeciesStepView } from "./species-step.view";
import type { SpellsStep } from "./spells-step.view";
import { CantripsStepView, SpellsStepView } from "./spells-step.view";
import { CharacterPreviewView } from "./character-preview.view";
import { BuilderStepsView } from "./builder-steps.view";

export interface BuilderScreen {
  catalog: DndCatalog;
  builder: BuilderState;
  abilities: AbilitiesStep;
  spells: SpellsStep;
  preview: ComputedCharacter | null;
  characterName: string;
  canFinish: boolean;
  isFinishing: boolean;
  onFinish: () => void;
}

/**
 * Trois colonnes : le fil conducteur, les choix, le résumé. Sous `lg` elles
 * s'empilent — le résumé passe en dernier, il accompagne sans commander.
 */
export function CharacterBuilderView({ screen }: { screen: BuilderScreen }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_20rem] lg:items-start">
      <BuilderStepsView builder={screen.builder} />
      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <StepHeading step={screen.builder.step} />
            <StepContent screen={screen} />
          </CardContent>
        </Card>
        <BuilderFooter screen={screen} />
      </div>
      <CharacterPreviewView
        catalog={screen.catalog}
        draft={screen.builder.draft}
        preview={screen.preview}
        characterName={screen.characterName}
      />
    </div>
  );
}

function StepHeading({ step }: { step: BuilderStep }) {
  return <h2 className="section-title mb-4 text-lg">{stepLabel(step)}</h2>;
}

/**
 * Table de rendu plutôt qu'une cascade de `if` : le `Record<BuilderStep, …>`
 * oblige à traiter chaque étape, et une étape ajoutée sans son écran casse `tsc`.
 */
function StepContent({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder } = screen;
  const shared = { catalog, draft: builder.draft, onChange: builder.update };
  const spells = { step: screen.spells, draft: builder.draft, onChange: builder.update };

  const screens: Record<BuilderStep, () => ReactElement | null> = {
    species: () => <SpeciesStepView {...shared} />,
    lineage: () => <LineageStep screen={screen} />,
    class: () => <ClassStepView {...shared} />,
    classSkills: () => <ClassSkillsStepView {...shared} />,
    expertise: () => <ExpertiseStepView {...shared} />,
    fightingStyle: () => <ClassChoiceStep screen={screen} choiceKey="fightingStyle" />,
    classOrder: () => <ClassChoiceStep screen={screen} choiceKey="order" />,
    background: () => <BackgroundStepView {...shared} />,
    feats: () => <FeatsStepView {...shared} />,
    abilities: () => (
      <AbilitiesStepView step={screen.abilities} draft={shared.draft} onChange={shared.onChange} />
    ),
    cantrips: () => <CantripsStepView {...spells} />,
    spells: () => <SpellsStepView {...spells} />,
    equipment: () => <EquipmentStepView {...shared} />,
  };

  return screens[builder.step]();
}

function LineageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder } = screen;
  const lineage = catalog.species.find(
    (entry) => entry.key === builder.draft.speciesKey,
  )?.lineage;
  if (!lineage) return null;

  return (
    <ChoiceStepView
      title={lineage.label}
      description="Ce choix vous confère des pouvoirs surnaturels propres à votre lignée."
      options={lineage.options}
      selectedKey={builder.draft.lineageKey}
      onSelect={(lineageKey) => builder.update({ lineageKey })}
    />
  );
}

interface ClassChoiceStepProps {
  screen: BuilderScreen;
  choiceKey: "fightingStyle" | "order";
}

/** Style de combat et Ordre partagent la même forme : un choix parmi une liste. */
function ClassChoiceStep({ screen, choiceKey }: ClassChoiceStepProps) {
  const { catalog, builder } = screen;
  const choices = catalog.classes.find((entry) => entry.key === builder.draft.classKey)
    ?.level1Choices;
  const choice = choices?.find((entry) =>
    choiceKey === "fightingStyle"
      ? entry.key === "fightingStyle"
      : entry.key !== "fightingStyle",
  );
  if (!choice) return null;

  const selected =
    choiceKey === "fightingStyle" ? builder.draft.fightingStyle : builder.draft.classOrder;

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

function BuilderFooter({ screen }: { screen: BuilderScreen }) {
  const { builder } = screen;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button type="button" variant="outline" onClick={builder.previous}>
        Précédent
      </Button>
      {builder.isLastStep ? (
        <Button
          type="button"
          disabled={!screen.canFinish || screen.isFinishing}
          onClick={screen.onFinish}
        >
          {screen.isFinishing ? "Enregistrement..." : "Créer le personnage"}
        </Button>
      ) : (
        <Button type="button" disabled={!builder.canGoNext} onClick={builder.next}>
          Suivant
        </Button>
      )}
    </div>
  );
}
