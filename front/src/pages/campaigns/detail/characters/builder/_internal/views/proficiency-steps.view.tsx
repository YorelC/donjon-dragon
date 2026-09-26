import type { Language } from "@donjon-dragon/shared";
import { backgroundOf, classOf } from "../types/builder-lookups";
import { toolsKnownBesides } from "../types/known-tools";
import type { BuilderScreen } from "./character-builder.view";
import { BoundedChoiceStepView, type BoundedChoice } from "./bounded-choice-step.view";

export function BackgroundToolStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = contextOf(screen);
  const options = backgroundOf({ catalog, composition })?.toolOptions ?? [];
  const selected = composition.backgroundTool ? [composition.backgroundTool] : [];

  return <BoundedChoiceStepView choice={{
    count: 1, options, labels: catalog.toolLabels, selected,
    blocked: toolsKnownBesides({ catalog, composition }, selected),
    onChange: ([backgroundTool]) => screen.builder.update({ backgroundTool: backgroundTool ?? null }),
  }} />;
}

export function WeaponMasteriesStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = contextOf(screen);
  const choice = classOf({ catalog, composition })?.weaponMastery;
  if (!choice) return null;

  return <BoundedChoiceStepView choice={{
    ...choice, labels: catalog.weaponLabels, selected: composition.weaponMasteries,
    blocked: [], onChange: (weaponMasteries) => screen.builder.update({ weaponMasteries }),
  }} />;
}

export function ClassToolsStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = contextOf(screen);
  const choice = classOf({ catalog, composition })?.toolChoice;
  if (!choice) return null;

  return <BoundedChoiceStepView choice={{
    ...choice, labels: catalog.toolLabels, selected: composition.classTools,
    blocked: toolsKnownBesides({ catalog, composition }, composition.classTools),
    onChange: (classTools) => screen.builder.update({ classTools }),
  }} />;
}

export function ClassLanguageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = contextOf(screen);
  const languages = [...catalog.languages.standard, ...catalog.languages.rare];
  const choice: BoundedChoice = {
    count: 1,
    options: languages.map((entry) => entry.key),
    labels: Object.fromEntries(languages.map((entry) => [entry.key, entry.name])),
    selected: composition.classLanguage ? [composition.classLanguage] : [],
    blocked: composition.standardLanguages,
    onChange: ([classLanguage]) => screen.builder.update({
      classLanguage: (classLanguage as Language | undefined) ?? null,
    }),
  };

  return <BoundedChoiceStepView choice={choice} />;
}

function contextOf(screen: BuilderScreen) {
  return { catalog: screen.catalog, composition: screen.builder.composition };
}
