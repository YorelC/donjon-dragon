import { BACKGROUNDS, type Background } from '../reference/backgrounds';
import { CLASSES } from '../reference/classes';
import { CLASS_ORDERS } from '../reference/class-orders';
import { FIGHTING_STYLES } from '../reference/fighting-styles';
import type { CollectedEffect, EffectSource, Feature } from '../reference/effect';
import { ORIGIN_FEATS } from '../reference/origin-feats';
import { SPECIES } from '../reference/species';
import type { CharacterBuild } from './character-build';

/**
 * Le Collector : il rassemble les effets de toutes les sources et leur attache
 * leur provenance.
 *
 * La provenance n'est pas décorative. C'est elle qui permet d'écrire « CA 16
 * (cotte de mailles) » plutôt qu'un 16 que personne ne peut vérifier, et c'est
 * elle qui dira quoi retirer le jour où une source disparaît.
 */
export function collectEffects(build: CharacterBuild): CollectedEffect[] {
  return [
    ...collectSpeciesEffects(build),
    ...collectClassEffects(build),
    ...collectBackgroundEffects(build),
    ...collectFeatEffects(build),
  ];
}

function collectSpeciesEffects(build: CharacterBuild): CollectedEffect[] {
  const species = SPECIES[build.speciesKey];
  const speciesSource: EffectSource = {
    type: 'species',
    key: species.key,
    label: species.name,
  };
  const lineage = findLineage(build);
  if (!lineage) return flatten(species.traits, speciesSource);

  const lineageSource: EffectSource = {
    type: 'lineage',
    key: lineage.key,
    label: lineage.name,
  };
  return [
    ...flatten(species.traits, speciesSource),
    ...flatten(lineage.traits, lineageSource),
  ];
}

function findLineage(build: CharacterBuild) {
  const options = SPECIES[build.speciesKey].lineage?.options ?? [];
  return options.find((lineage) => lineage.key === build.lineageKey);
}

function collectClassEffects(build: CharacterBuild): CollectedEffect[] {
  const characterClass = CLASSES[build.classKey];

  return [
    ...flatten(characterClass.level1Features, {
      type: 'class',
      key: characterClass.key,
      label: characterClass.name,
    }),
    ...collectFightingStyle(build),
    ...collectClassOrder(build),
  ];
}

/** Le don de Style de combat que le guerrier choisit au niveau 1. */
function collectFightingStyle(build: CharacterBuild): CollectedEffect[] {
  const chosen = build.choices.all.flatMap((choice) =>
    choice.fightingStyle ? [choice.fightingStyle] : [],
  )[0];
  const style = chosen ? FIGHTING_STYLES[chosen] : undefined;
  if (!style) return [];

  return flatten([{ ...style, description: style.description }], {
    type: 'class',
    key: style.key,
    label: 'Style de combat',
  });
}

/** L'Ordre divin du clerc, l'Ordre primitif du druide. */
function collectClassOrder(build: CharacterBuild): CollectedEffect[] {
  const order = CLASS_ORDERS[build.classKey];
  const chosen = build.choices.all.flatMap((choice) =>
    choice.classOrder ? [choice.classOrder] : [],
  )[0];
  const option = order?.options.find((entry) => entry.key === chosen);
  if (!order || !option) return [];

  return flatten([{ ...option, description: option.description }], {
    type: 'class',
    key: option.key,
    label: order.name,
  });
}

/**
 * L'historique n'a pas de `Feature` dans le catalogue : ses deux compétences et
 * son outil y sont des champs. On les remet en forme d'octroi ici, pour que tout
 * traverse le moteur par le même chemin.
 */
function collectBackgroundEffects(build: CharacterBuild): CollectedEffect[] {
  const background = BACKGROUNDS[build.backgroundKey];

  return flatten([backgroundFeature(background)], {
    type: 'background',
    key: background.key,
    label: background.name,
  });
}

function backgroundFeature(background: Background): Feature {
  return {
    key: background.key,
    name: background.name,
    description: background.description,
    effects: [
      {
        application: 'grant',
        grants: {
          skillProficiencies: background.skillProficiencies,
          toolProficiencies: [background.toolProficiency],
          originFeat: background.originFeat,
        },
      },
    ],
  };
}

/**
 * Les dons octroyés : celui de l'historique, plus ceux qu'un trait a fait
 * choisir — le Polyvalent de l'humain est le seul cas au niveau 1.
 */
function collectFeatEffects(build: CharacterBuild): CollectedEffect[] {
  const chosen = build.choices.all.flatMap((choice) =>
    choice.originFeat ? [choice.originFeat] : [],
  );
  const keys = new Set([BACKGROUNDS[build.backgroundKey].originFeat, ...chosen]);

  return [...keys].flatMap((key) => {
    const feat = ORIGIN_FEATS[key];
    return flatten([feat], { type: 'feat', key: feat.key, label: feat.name });
  });
}

function flatten(features: readonly Feature[], source: EffectSource): CollectedEffect[] {
  return features.flatMap((feature) =>
    feature.effects.map((effect) => ({ effect, source, feature: feature.name })),
  );
}
