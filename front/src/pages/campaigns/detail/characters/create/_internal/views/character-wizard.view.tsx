import type { ReactElement } from "react";
import type { ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import { CharacterSheetView } from "@/shared/components/character/character-sheet.view";
import {
  STEP_LABELS,
  type WizardState,
  type WizardStep,
} from "../hooks/use-character-wizard";
import type { AbilitiesStep } from "./abilities-step.view";
import { AbilitiesStepView } from "./abilities-step.view";
import { BackgroundStepView } from "./background-step.view";
import { ClassStepView } from "./class-step.view";
import { EquipmentStepView } from "./equipment-step.view";
import { SpeciesStepView } from "./species-step.view";
import type { SpellsStep } from "./spells-step.view";
import { SpellsStepView } from "./spells-step.view";

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

export function CharacterWizardView({ screen }: { screen: WizardScreen }) {
  return (
    <div className="grid gap-4">
      <StepTabs wizard={screen.wizard} />
      <Card>
        <CardContent className="pt-6">
          <StepContent screen={screen} />
        </CardContent>
      </Card>
      <WizardFooter screen={screen} />
    </div>
  );
}

function StepTabs({ wizard }: { wizard: WizardState }) {
  return (
    <div className="flex flex-wrap gap-2">
      {wizard.steps.map((step) => (
        <Button
          key={step}
          type="button"
          size="sm"
          variant={step === wizard.step ? "default" : "outline"}
          onClick={() => wizard.goTo(step)}
        >
          {STEP_LABELS[step]}
        </Button>
      ))}
    </div>
  );
}

/**
 * Table de rendu plutôt qu'une cascade de `if` : le `Record<WizardStep, …>`
 * oblige à traiter chaque étape, et une étape ajoutée sans son écran casse `tsc`.
 */
function StepContent({ screen }: { screen: WizardScreen }) {
  const { catalog, wizard } = screen;
  const shared = { catalog, draft: wizard.draft, onChange: wizard.update };

  const screens: Record<WizardStep, () => ReactElement> = {
    species: () => <SpeciesStepView {...shared} />,
    class: () => <ClassStepView {...shared} />,
    background: () => <BackgroundStepView {...shared} />,
    equipment: () => <EquipmentStepView {...shared} />,
    abilities: () => (
      <AbilitiesStepView step={screen.abilities} draft={shared.draft} onChange={shared.onChange} />
    ),
    spells: () => (
      <SpellsStepView step={screen.spells} draft={shared.draft} onChange={shared.onChange} />
    ),
    summary: () => <SummaryStep screen={screen} />,
  };

  return screens[wizard.step]();
}

function SummaryStep({ screen }: { screen: WizardScreen }) {
  if (!screen.preview) {
    return (
      <p className="text-sm text-muted-foreground">
        Choisissez une espèce, une classe et un historique pour voir la fiche.
      </p>
    );
  }

  return (
    <CharacterSheetView
      name={screen.characterName}
      sheet={screen.preview}
      skillLabels={screen.catalog.skillLabels}
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
      {wizard.step === "summary" ? (
        <Button type="button" disabled={!screen.canFinish || screen.isFinishing} onClick={screen.onFinish}>
          {screen.isFinishing ? "Enregistrement..." : "Terminer le personnage"}
        </Button>
      ) : (
        <Button type="button" onClick={wizard.next}>
          Suivant
        </Button>
      )}
    </div>
  );
}
