import type { StepContext } from "./builder-lookups";
import type { CharacterComposition } from "./character-composition";

/**
 * Ce qu'une vue d'étape reçoit : de quoi lire (catalogue et composition), de
 * quoi modifier, et de quoi montrer une option dans la fiche détaillée.
 */
export interface StepBinding extends StepContext {
  onChange: (patch: Partial<CharacterComposition>) => void;
  /** Montre l'option dans la fiche détaillée, le temps d'un survol ou d'un focus. */
  preview: (key: string) => void;
}
