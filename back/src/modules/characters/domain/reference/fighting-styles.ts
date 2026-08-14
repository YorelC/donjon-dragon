// Les 10 dons de Style de combat, accordés au niveau 1 par le guerrier.
// Source : docs/characteres/feats.seed.json et feats.effects.json, catégorie
// `fightingStyle`.
//
// Deux seulement changent la fiche au niveau 1 : Défense, qui ajoute 1 à la CA
// tant qu'une armure est portée, et Combat à mains nues, qui remplace les dégâts
// de la Frappe. Les huit autres partent en `informational` : leur condition tient
// dans une phrase (« armes à distance », « arme de corps à corps sans seconde
// arme ») que le vocabulaire fermé de PassiveEffect ne sait pas porter. Les
// afficher sans les appliquer est honnête ; leur inventer un prédicat ne le
// serait pas.

import { abilityMod, constant, type Effect } from './effect';

export interface FightingStyle {
  key: string;
  name: string;
  description: string;
  effects: readonly Effect[];
}

const DEFENSE_ARMOR_CLASS_BONUS = 1;

const informational = (note: string): Effect[] => [{ application: 'informational', note }];

const FIGHTING_STYLE_LIST: readonly FightingStyle[] = [
  {
    key: 'archery',
    name: 'Archerie',
    description: "Vous gagnez +2 aux jets d'attaque effectués avec des armes à distance.",
    effects: informational("+2 aux jets d'attaque avec une arme à distance."),
  },
  {
    key: 'blind-fighting',
    name: 'Combat aveugle',
    description: 'Vous disposez de la Vision aveugle sur 3 m.',
    effects: informational('Vision aveugle sur 3 m.'),
  },
  {
    key: 'defense',
    name: 'Défense',
    description: 'Tant que vous portez une armure, vous gagnez +1 à la Classe d’armure.',
    effects: [
      {
        application: 'passive',
        passive: {
          kind: 'bonus',
          target: 'armorClass',
          formula: constant(DEFENSE_ARMOR_CLASS_BONUS),
          requires: 'armored',
        },
      },
    ],
  },
  {
    key: 'dueling',
    name: 'Duel',
    description:
      "Quand vous tenez une arme de corps à corps à une main et aucune autre arme, vous gagnez +2 aux jets de dégâts avec cette arme.",
    effects: informational(
      '+2 aux dégâts avec une arme de corps à corps tenue à une main, sans seconde arme.',
    ),
  },
  {
    key: 'great-weapon-fighting',
    name: 'Combat à deux mains',
    description:
      "Avec une arme à deux mains ou Polyvalente, les 1 et les 2 obtenus sur un dé de dégâts comptent comme des 3.",
    effects: informational(
      'Les 1 et les 2 des dés de dégâts comptent comme des 3, avec une arme à deux mains ou Polyvalente.',
    ),
  },
  {
    key: 'interception',
    name: 'Interception',
    description:
      "En Réaction, vous réduisez de 1d10 plus votre bonus de maîtrise les dégâts infligés à une créature proche.",
    effects: informational(
      'Réaction : réduire de 1d10 + bonus de maîtrise les dégâts subis par une créature à 1,50 m.',
    ),
  },
  {
    key: 'protection',
    name: 'Protection',
    description:
      "En Réaction, vous imposez un Désavantage à un jet d'attaque visant une créature proche.",
    effects: informational(
      "Réaction : Désavantage à une attaque visant une créature à 1,50 m. Bouclier requis.",
    ),
  },
  {
    key: 'thrown-weapon-fighting',
    name: 'Armes de jet',
    description: 'Vous gagnez +2 aux jets de dégâts des armes dotées de la propriété Lancer.',
    effects: informational('+2 aux dégâts avec une arme dotée de la propriété Lancer.'),
  },
  {
    key: 'two-weapon-fighting',
    name: 'Combat à deux armes',
    description:
      "Vous ajoutez votre modificateur de caractéristique aux dégâts de l'attaque de votre seconde arme.",
    effects: informational(
      'Modificateur de caractéristique ajouté aux dégâts de la seconde arme.',
    ),
  },
  {
    key: 'unarmed-fighting',
    name: 'Combat à mains nues',
    description:
      'Vos Frappes à mains nues infligent 1d6 dégâts contondants plus votre modificateur de Force.',
    effects: [
      {
        application: 'passive',
        passive: {
          kind: 'set',
          target: 'unarmedDamage',
          dice: '1d6',
          formula: abilityMod('strength'),
        },
      },
    ],
  },
];

export const FIGHTING_STYLES: Readonly<Record<string, FightingStyle>> = Object.fromEntries(
  FIGHTING_STYLE_LIST.map((style) => [style.key, style]),
);

export const FIGHTING_STYLE_KEYS: readonly string[] = FIGHTING_STYLE_LIST.map(
  (style) => style.key,
);
