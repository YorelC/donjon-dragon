import { useState } from "react";
import type { BuilderStep } from "../types/builder-steps";

/** L'option que la fiche détaillée montre, le temps d'un survol ou d'un focus. */
export interface OptionFocus {
  key: string | null;
  show: (key: string) => void;
  clear: () => void;
}

/**
 * La clé est rangée avec l'étape qui l'a vue naître : changer d'étape la périme
 * d'elle-même, sans effet ni remise à zéro à orchestrer.
 */
export function useOptionFocus(step: BuilderStep): OptionFocus {
  const [focused, setFocused] = useState<{ step: BuilderStep; key: string } | null>(null);

  return {
    key: focused?.step === step ? focused.key : null,
    show: (key) => setFocused({ step, key }),
    clear: () => setFocused(null),
  };
}
