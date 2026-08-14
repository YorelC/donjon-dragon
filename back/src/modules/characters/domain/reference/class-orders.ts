// Les deux capacités de niveau 1 qui font choisir un rôle : l'Ordre divin du
// clerc et l'Ordre primitif du druide.
//
// Sources : le texte officiel pour le clerc, et
// docs/characteres/classes/druid-primal-orders.seed.json pour le druide.
//
// Elles sont symétriques — une moitié martiale, une moitié mystique — et ce sont
// de vrais effets, pas des rappels : un clerc Protecteur porte un harnois, ce qui
// change sa CA.

import { abilityMod, atLeast, type Effect } from './effect';
import type { ClassKey } from './keys';

export interface ClassOrderOption {
  key: string;
  name: string;
  description: string;
  effects: readonly Effect[];
}

export interface ClassOrder {
  key: string;
  name: string;
  description: string;
  options: readonly ClassOrderOption[];
}

const EXTRA_CANTRIP = 1;
const MYSTIC_BONUS_FLOOR = 1;

/** « Votre modificateur de Sagesse (minimum +1) » — d'où le plancher. */
const mysticInsight = (skills: readonly ['arcana', 'religion' | 'nature']): Effect[] =>
  skills.map((skill) => ({
    application: 'passive',
    passive: {
      kind: 'bonus',
      target: 'skillCheck',
      skill,
      formula: atLeast(MYSTIC_BONUS_FLOOR, abilityMod('wisdom')),
    },
  }));

const martialTraining = (armor: 'heavy' | 'medium'): Effect[] => [
  {
    application: 'grant',
    grants: { weaponProficiencies: ['martial'], armorTraining: [armor] },
  },
];

const extraCantrip = (): Effect => ({
  application: 'grant',
  grants: { extraCantrips: EXTRA_CANTRIP },
});

const CLASS_ORDER_LIST: readonly (ClassOrder & { classKey: ClassKey })[] = [
  {
    classKey: 'cleric',
    key: 'divine-order',
    name: 'Ordre divin',
    description: 'Vous vous êtes consacré à l’un des rôles sacrés suivants de votre choix.',
    options: [
      {
        key: 'protector',
        name: 'Protecteur',
        description:
          'Entraîné au combat, vous gagnez la maîtrise des armes de guerre et la formation aux armures lourdes.',
        effects: martialTraining('heavy'),
      },
      {
        key: 'thaumaturge',
        name: 'Thaumaturge',
        description:
          "Vous connaissez un sort mineur de clerc supplémentaire. Votre connexion au divin vous confère un bonus à vos jets d'Intelligence (Arcanes ou Religion) égal à votre modificateur de Sagesse, minimum +1.",
        effects: [extraCantrip(), ...mysticInsight(['arcana', 'religion'])],
      },
    ],
  },
  {
    classKey: 'druid',
    key: 'primal-order',
    name: 'Ordre primitif',
    description: 'Vous vous êtes consacré à l’un des rôles sacrés suivants de votre choix.',
    options: [
      {
        key: 'magician',
        name: 'Mage',
        description:
          "Vous connaissez un sort mineur de druide supplémentaire. Votre lien mystique avec la nature vous confère un bonus à vos jets d'Intelligence (Arcanes ou Nature) égal à votre modificateur de Sagesse, minimum +1.",
        effects: [extraCantrip(), ...mysticInsight(['arcana', 'nature'])],
      },
      {
        key: 'warden',
        name: 'Gardien',
        description:
          'Entraîné au combat, vous gagnez la maîtrise des armes de guerre et la formation aux armures intermédiaires.',
        effects: martialTraining('medium'),
      },
    ],
  },
];

export const CLASS_ORDERS: Readonly<Partial<Record<ClassKey, ClassOrder>>> =
  Object.fromEntries(CLASS_ORDER_LIST.map((order) => [order.classKey, order]));
