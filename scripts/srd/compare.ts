import type { Divergence } from './divergence.ts';
import { describe, isSameValue } from './divergence.ts';

/**
 * Le moteur de comparaison, commun aux trois domaines.
 *
 * Chaque champ est comparé séparément pour que le rapport nomme le champ qui a
 * bougé — « hitDie », pas « la classe ». Un domaine n'a donc qu'à fournir sa
 * table de comparateurs.
 */

export type Comparator<TProject, TSrd> = {
  field: string;
  ofProject: (project: TProject) => unknown;
  ofSrd: (srd: TSrd) => unknown;
};

export type Identity = { domain: string; key: string };

export type Pair<TProject, TSrd> = { project: TProject; srd: TSrd };

export function compareEntry<TProject, TSrd>(
  identity: Identity,
  pair: Pair<TProject, TSrd>,
  comparators: Comparator<TProject, TSrd>[],
): Divergence[] {
  return comparators
    .filter((comparator) => !isSameValue(comparator.ofProject(pair.project), comparator.ofSrd(pair.srd)))
    .map((comparator) => ({
      ...identity,
      field: comparator.field,
      project: describe(comparator.ofProject(pair.project)),
      srd: describe(comparator.ofSrd(pair.srd)),
    }));
}
