import type { Language } from "@donjon-dragon/shared";
import { backgroundOf, classOf } from "../types/builder-lookups";
import { toolsKnownBesides } from "../types/known-tools";
import type { BuilderScreen } from "./character-builder.view";
import { BoundedChoiceStepView, type BoundedChoice } from "./bounded-choice-step.view";

export function BackgroundToolStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = screen.context;
  const options = backgroundOf({ catalog, composition })?.toolOptions ?? [];
  const selected = composition.backgroundTool ? [composition.backgroundTool] : [];

  return <BoundedChoiceStepView choice={{
    heading: "Outils disponibles", count: 1, options, labels: catalog.toolLabels, selected,
    blocked: toolsKnownBesides({ catalog, composition }, selected),
    onChange: ([backgroundTool]) => screen.builder.update({ backgroundTool: backgroundTool ?? null }),
    onPreview: screen.focus.show,
  }} />;
}

export function WeaponMasteriesStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = screen.context;
  const choice = classOf({ catalog, composition })?.weaponMastery;
  if (!choice) return null;

  return <BoundedChoiceStepView choice={{
    ...choice, heading: "Armes disponibles", labels: catalog.weaponLabels, selected: composition.weaponMasteries,
    blocked: [], onChange: (weaponMasteries) => screen.builder.update({ weaponMasteries }),
    onPreview: screen.focus.show,
  }} />;
}

export function ClassToolsStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = screen.context;
  const choice = classOf({ catalog, composition })?.toolChoice;
  if (!choice) return null;

  return <BoundedChoiceStepView choice={{
    ...choice, heading: "Outils disponibles", labels: catalog.toolLabels, selected: composition.classTools,
    blocked: toolsKnownBesides({ catalog, composition }, composition.classTools),
    onChange: (classTools) => screen.builder.update({ classTools }),
    onPreview: screen.focus.show,
  }} />;
}

export function ClassLanguageStep({ screen }: { screen: BuilderScreen }) {
  const { catalog, composition } = screen.context;
  const languages = [...catalog.languages.standard, ...catalog.languages.rare];
  const choice: BoundedChoice = {
    heading: "Langues disponibles",
    count: 1,
    options: languages.map((entry) => entry.key),
    labels: Object.fromEntries(languages.map((entry) => [entry.key, entry.name])),
    selected: composition.classLanguage ? [composition.classLanguage] : [],
    blocked: composition.standardLanguages,
    onChange: ([classLanguage]) => screen.builder.update({
      classLanguage: (classLanguage as Language | undefined) ?? null,
    }),
    onPreview: screen.focus.show,
  };

  return <BoundedChoiceStepView choice={choice} />;
}
