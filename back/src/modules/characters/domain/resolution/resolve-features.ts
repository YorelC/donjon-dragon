import type {
  CollectedEffect,
  EffectApplication,
  EffectSourceType,
} from '../reference/effect';
import { evaluateFormula, type FormulaContext } from './evaluate-formula';

export interface ResolvedFeature {
  name: string;
  source: string;
  sourceType: EffectSourceType;
  /** Une capacité porte souvent plusieurs modes : Vigilant est passif ET informatif. */
  applications: EffectApplication[];
  notes: string[];
}

export interface ResolvedResource {
  key: string;
  feature: string;
  max: number;
  recovery: string;
}

/**
 * Les capacités telles qu'on les affiche : ni exécutées, ni interprétées.
 *
 * Au niveau 1 le moteur ne déclenche rien — `reactive` et `active` restent
 * latents. Mais ils doivent apparaître sur la fiche, sinon un joueur ne sait pas
 * qu'il a une Rage à dépenser.
 *
 * On regroupe par capacité et non par effet : une capacité à deux effets est
 * une ligne, pas deux. Et on garde les `grant` — les jeter rendait Doué, qui
 * n'a que des effets d'octroi, totalement invisible sur la fiche d'un noble.
 */
export function resolveFeatures(effects: readonly CollectedEffect[]): ResolvedFeature[] {
  const byFeature = new Map<string, ResolvedFeature>();

  effects.forEach((collected) => {
    const key = `${collected.source.type}:${collected.source.key}:${collected.feature}`;
    const existing = byFeature.get(key) ?? emptyFeature(collected);

    existing.applications.push(collected.effect.application);
    if (collected.effect.note) existing.notes.push(collected.effect.note);
    byFeature.set(key, existing);
  });

  return [...byFeature.values()];
}

function emptyFeature(collected: CollectedEffect): ResolvedFeature {
  return {
    name: collected.feature,
    source: collected.source.label,
    sourceType: collected.source.type,
    applications: [],
    notes: [],
  };
}

/**
 * Les compteurs : Rage, Second souffle, points de Chance, Souffle du drakéide.
 * Leur maximum est une formule — les points de Chance valent le bonus de
 * maîtrise, l'Imposition des mains cinq fois le niveau.
 */
export function resolveResources(
  effects: readonly CollectedEffect[],
  context: FormulaContext,
): ResolvedResource[] {
  return effects.flatMap((collected) => {
    const resource = collected.effect.resource;
    if (!resource) return [];

    return [
      {
        key: resource.key,
        feature: collected.feature,
        max: evaluateFormula(resource.max, context),
        recovery: resource.recovery,
      },
    ];
  });
}

/** La Frappe à mains nues : 1 dégât contondant, sauf si un trait la remplace. */
const DEFAULT_UNARMED_DAMAGE = '1';

export function resolveUnarmedDamage(effects: readonly CollectedEffect[]): string {
  const replacement = effects
    .flatMap((collected) => {
      const passive = collected.effect.passive;
      if (passive?.target !== 'unarmedDamage' || !passive.dice) return [];
      return [passive.dice];
    })
    .at(-1);

  return replacement ?? DEFAULT_UNARMED_DAMAGE;
}
