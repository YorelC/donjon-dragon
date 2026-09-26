import type { ReactElement } from "react";
import type { BuilderStep } from "../types/builder-steps";
import type { StepBinding } from "../types/step-binding";
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
  const { builder } = screen;
  const binding: StepBinding = { ...screen.context, onChange: builder.update, preview: screen.focus.show };

  const screens: Record<BuilderStep, () => ReactElement | null> = {
    species: () => <SpeciesStepView binding={binding} />,
    lineage: () => <LineageStep screen={screen} />,
    languages: () => <LanguagesStepView binding={binding} />,
    class: () => <ClassStepView binding={binding} />,
    background: () => <BackgroundStepView binding={binding} />,
    backgroundTool: () => <BackgroundToolStep screen={screen} />,
    classSkills: () => <ClassSkillsStepView binding={binding} />,
    fightingStyle: () => <ClassChoiceStep screen={screen} choiceKey="fightingStyle" />,
    classOrder: () => <ClassChoiceStep screen={screen} choiceKey="order" />,
    weaponMasteries: () => <WeaponMasteriesStep screen={screen} />,
    classTools: () => <ClassToolsStep screen={screen} />,
    classLanguage: () => <ClassLanguageStep screen={screen} />,
    feats: () => <FeatsStepView binding={binding} />,
    expertise: () => <ExpertiseStepView binding={binding} />,
    invocation: () => <InvocationStepView binding={binding} tomeSpells={screen.spells.tomeSpells} />,
    abilities: () => (
      <AbilitiesStepView step={screen.abilities} composition={binding.composition} onChange={binding.onChange} />
    ),
    cantrips: () => <CantripsStepView spells={screen.spells} binding={binding} />,
    spells: () => <SpellsStepView spells={screen.spells} binding={binding} />,
    equipment: () => <EquipmentStepView binding={binding} items={screen.items} />,
    identity: () => <IdentityStepView binding={binding} isFrozen={screen.isEditing} />,
  };

  return screens[builder.step]();
}
