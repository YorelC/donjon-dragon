import type { Language } from "@donjon-dragon/shared";
import { STANDARD_LANGUAGE_QUOTA } from "../types/builder-validity";
import type { StepBinding } from "../types/step-binding";
import { BoundedChoiceStepView } from "./bounded-choice-step.view";

/**
 * Les deux langues standards de la création.
 *
 * La liste vient du serveur : ni le Commun, déjà connu, ni les langues rares,
 * qui relèvent d'autres sources — la langue supplémentaire du Roublard, par
 * exemple. Le front ne redit pas ces listes, il les reçoit.
 */
export function LanguagesStepView({ binding }: { binding: StepBinding }) {
  const languages = binding.catalog.languages.standard;

  return (
    <BoundedChoiceStepView
      choice={{
        heading: "Langues disponibles",
        count: STANDARD_LANGUAGE_QUOTA,
        options: languages.map((language) => language.key),
        labels: Object.fromEntries(languages.map((language) => [language.key, language.name])),
        selected: binding.composition.standardLanguages,
        blocked: [],
        onChange: (standardLanguages) =>
          binding.onChange({ standardLanguages: standardLanguages as Language[] }),
        onPreview: binding.preview,
      }}
    />
  );
}
