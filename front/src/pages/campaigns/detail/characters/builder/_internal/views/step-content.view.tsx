import type { ReactElement } from "react";
import type { BuilderStep } from "../types/builder-steps";
import { AbilitiesStepView } from "./abilities-step.view";
import { BackgroundStepView } from "./background-step.view";
import { ClassChoiceStep, LineageStep } from "./builder-choice-steps.view";
import type { BuilderScreen } from "./character-builder.view";
import { ClassStepView } from "./class-step.view";
import { EquipmentStepView } from "./equipment-step.view";
import { FeatsStepView } from "./feats-step.view";
import { IdentityStepView } from "./identity-step.view";
import { InvocationStepView } from "./invocation-step.view";
import { LanguagesStepView } from "./languages-step.view";
import {
  BackgroundToolStep,
  ClassLanguageStep,
  ClassToolsStep,
  WeaponMasteriesStep,
} from "./proficiency-steps.view";
import { ClassSkillsStepView, ExpertiseStepView } from "./skill-choice-step.view";
import { SpeciesStepView } from "./species-step.view";
import { CantripsStepView, SpellsStepView } from "./spells-step.view";

/**
 * Table de rendu plutôt qu'une cascade de `if` : le `Record<BuilderStep, …>`
 * oblige à traiter chaque étape, et une étape ajoutée sans son écran casse `tsc`.
 */
export function StepContentView({ screen }: { screen: BuilderScreen }) {
  const { catalog, builder } = screen;
  const shared = { catalog, composition: builder.composition, onChange: builder.update };
  const spells = { step: screen.spells, composition: builder.composition, onChange: builder.update };

  const screens: Record<BuilderStep, () => ReactElement | null> = {
    species: () => <SpeciesStepView {...shared} />,
    lineage: () => <LineageStep screen={screen} />,
    languages: () => <LanguagesStepView {...shared} />,
    class: () => <ClassStepView {...shared} />,
    background: () => <BackgroundStepView {...shared} />,
    backgroundTool: () => <BackgroundToolStep screen={screen} />,
    classSkills: () => <ClassSkillsStepView {...shared} />,
    fightingStyle: () => <ClassChoiceStep screen={screen} choiceKey="fightingStyle" />,
    classOrder: () => <ClassChoiceStep screen={screen} choiceKey="order" />,
    weaponMasteries: () => <WeaponMasteriesStep screen={screen} />,
    classTools: () => <ClassToolsStep screen={screen} />,
    classLanguage: () => <ClassLanguageStep screen={screen} />,
    feats: () => <FeatsStepView {...shared} />,
    expertise: () => <ExpertiseStepView {...shared} />,
    invocation: () => <InvocationStepView {...shared} tomeSpells={screen.spells.tomeSpells} />,
    abilities: () => (
      <AbilitiesStepView step={screen.abilities} composition={shared.composition} onChange={shared.onChange} />
    ),
    cantrips: () => <CantripsStepView {...spells} />,
    spells: () => <SpellsStepView {...spells} />,
    equipment: () => <EquipmentStepView {...shared} items={screen.items} />,
    identity: () => <IdentityStepView {...shared} isFrozen={screen.isEditing} />,
  };

  return screens[builder.step]();
}
