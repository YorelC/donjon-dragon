import { backgroundOf, classOf, type StepContext } from "./builder-lookups";

/**
 * Les outils déjà maîtrisés, d'office ou par un autre choix, hors ceux du choix
 * en cours. Une maîtrise ne se prend qu'une fois (B01-CLA-001, B01-ORI-006) :
 * le serveur refuse le doublon, l'écran doit l'empêcher avant.
 */
export function toolsKnownBesides(context: StepContext, own: readonly string[]): string[] {
  return allKnownTools(context).filter((tool) => !own.includes(tool));
}

function allKnownTools(context: StepContext): string[] {
  const { composition } = context;
  const fixedTool = backgroundOf(context)?.fixedTool;
  return [
    ...(classOf(context)?.toolProficiencies ?? []),
    ...(fixedTool ? [fixedTool] : []),
    ...(composition.backgroundTool ? [composition.backgroundTool] : []),
    ...composition.classTools,
    ...composition.featTools,
    ...Object.values(composition.featToolChoices).flatMap((tools) => tools ?? []),
  ];
}
