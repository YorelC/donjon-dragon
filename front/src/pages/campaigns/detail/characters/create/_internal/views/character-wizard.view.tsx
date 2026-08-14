import type { ReactElement } from "react";
import type { ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { WizardState } from "../hooks/use-character-wizard";
import { stepLabel, type WizardStep } from "../types/wizard-steps";
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
import { WizardSummaryView } from "./wizard-summary.view";
import { WizardTrailView } from "./wizard-trail.view";

export interface WizardScreen {
  catalog: DndCatalog;
  wizard: WizardState;
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
export function CharacterWizardView({ screen }: { screen: WizardScreen }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr_18rem] lg:items-start">
      <WizardTrailView wizard={screen.wizard} />
      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <StepHeading step={screen.wizard.step} />
            <StepContent screen={screen} />
          </CardContent>
        </Card>
        <WizardFooter screen={screen} />
      </div>
      <WizardSummaryView
        catalog={screen.catalog}
        draft={screen.wizard.draft}
        preview={screen.preview}
        characterName={screen.characterName}
      />
    </div>
  );
}

function StepHeading({ step }: { step: WizardStep }) {
  return <h2 className="section-title mb-4 text-lg">{stepLabel(step)}</h2>;
}

/**
 * Table de rendu plutôt qu'une cascade de `if` : le `Record<WizardStep, …>`
 * oblige à traiter chaque étape, et une étape ajoutée sans son écran casse `tsc`.
 */
function StepContent({ screen }: { screen: WizardScreen }) {
  const { catalog, wizard } = screen;
  const shared = { catalog, draft: wizard.draft, onChange: wizard.update };
  const spells = { step: screen.spells, draft: wizard.draft, onChange: wizard.update };

  const screens: Record<WizardStep, () => ReactElement | null> = {
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

  return screens[wizard.step]();
}

function LineageStep({ screen }: { screen: WizardScreen }) {
  const { catalog, wizard } = screen;
  const lineage = catalog.species.find(
    (entry) => entry.key === wizard.draft.speciesKey,
  )?.lineage;
  if (!lineage) return null;

  return (
    <ChoiceStepView
      title={lineage.label}
      description="Ce choix vous confère des pouvoirs surnaturels propres à votre lignée."
      options={lineage.options}
      selectedKey={wizard.draft.lineageKey}
      onSelect={(lineageKey) => wizard.update({ lineageKey })}
    />
  );
}

interface ClassChoiceStepProps {
  screen: WizardScreen;
  choiceKey: "fightingStyle" | "order";
}

/** Style de combat et Ordre partagent la même forme : un choix parmi une liste. */
function ClassChoiceStep({ screen, choiceKey }: ClassChoiceStepProps) {
  const { catalog, wizard } = screen;
  const choices = catalog.classes.find((entry) => entry.key === wizard.draft.classKey)
    ?.level1Choices;
  const choice = choices?.find((entry) =>
    choiceKey === "fightingStyle"
      ? entry.key === "fightingStyle"
      : entry.key !== "fightingStyle",
  );
  if (!choice) return null;

  const selected =
    choiceKey === "fightingStyle" ? wizard.draft.fightingStyle : wizard.draft.classOrder;

  return (
    <ChoiceStepView
      title={choice.name}
      description={choice.description}
      options={choice.options}
      selectedKey={selected}
      onSelect={(key) =>
        wizard.update(
          choiceKey === "fightingStyle" ? { fightingStyle: key } : { classOrder: key },
        )
      }
    />
  );
}

function WizardFooter({ screen }: { screen: WizardScreen }) {
  const { wizard } = screen;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button type="button" variant="outline" onClick={wizard.previous}>
        Précédent
      </Button>
      {wizard.isLastStep ? (
        <Button
          type="button"
          disabled={!screen.canFinish || screen.isFinishing}
          onClick={screen.onFinish}
        >
          {screen.isFinishing ? "Enregistrement..." : "Créer le personnage"}
        </Button>
      ) : (
        <Button type="button" disabled={!wizard.canGoNext} onClick={wizard.next}>
          Suivant
        </Button>
      )}
    </div>
  );
}
