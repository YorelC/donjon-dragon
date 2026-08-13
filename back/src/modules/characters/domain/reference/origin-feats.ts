// Les 10 dons d'Origines, les seuls accessibles à la création d'un personnage.
// Descriptions : docs/characteres/feats.seed.json (extraction AideDD).
//
// Les effets sont écrits ici à la main, pas repris de feats.effects.json :
// l'extraction automatique avait dégradé Chanceux, Doué et Initié à la magie en
// `informational`, ce qui leur retirait toute mécanique. Elle attribuait aussi à
// Bagarreur de tavernes un +1 de caractéristique que le PHB 2024 ne lui donne pas.

import type { Effect } from './effect';
import { abilityMod, perLevel, proficiencyBonus } from './effect';
import type { OriginFeatKey } from './keys';

export interface OriginFeat {
  key: OriginFeatKey;
  name: string;
  repeatable: boolean;
  description: string;
  effects: readonly Effect[];
}

const MAGIC_INITIATE_CANTRIPS = 2;
const MAGIC_INITIATE_SPELLS = 1;
const CRAFTER_TOOL_COUNT = 3;
const MUSICIAN_INSTRUMENT_COUNT = 3;
const SKILLED_PROFICIENCY_COUNT = 3;
const TOUGH_HP_PER_LEVEL = 2;

const ORIGIN_FEAT_LIST: readonly OriginFeat[] = [
  {
    key: 'alert',
    name: 'Vigilant',
    repeatable: false,
    description:
      "Maîtrise de l'Initiative : vous ajoutez votre bonus de maîtrise à vos jets d'Initiative. Échange d'Initiative : immédiatement après avoir lancé l'Initiative, vous pouvez l'échanger avec celle d'un allié consentant.",
    effects: [
      {
        application: 'passive',
        passive: { kind: 'bonus', target: 'initiative', formula: proficiencyBonus() },
      },
      {
        application: 'informational',
        note: "Échange d'Initiative avec un allié consentant, sauf si l'un des deux est Incapable d'agir.",
      },
    ],
  },
  {
    key: 'crafter',
    name: 'Façonneur',
    repeatable: false,
    description:
      "Maîtrise de trois outils d'artisan, ristourne de 20 % sur les objets non magiques, et fabrication d'une pièce d'équipement à la fin d'un Repos long.",
    effects: [
      {
        application: 'grant',
        grants: { toolChoice: { count: CRAFTER_TOOL_COUNT, options: 'any' } },
      },
      {
        application: 'informational',
        note: 'Ristourne de 20 % sur les objets non magiques ; Façonnage rapide à la fin d\'un Repos long.',
      },
    ],
  },
  {
    key: 'healer',
    name: 'Guérisseur',
    repeatable: false,
    description:
      "Soigneur de bataille : avec une trousse de soins, vous faites dépenser un Dé de vie à une créature proche et lui rendez le résultat plus votre bonus de maîtrise. Retirage des soins : vous relancez les 1 sur vos dés de soins.",
    effects: [
      {
        application: 'informational',
        note: "Soigneur de bataille : action Utilisation, trousse de soins, la cible dépense un Dé de vie et récupère le jet plus votre bonus de maîtrise.",
      },
      {
        application: 'informational',
        note: 'Retirage des soins : relancez les 1 sur les dés de soins, le nouveau résultat est conservé.',
      },
    ],
  },
  {
    key: 'lucky',
    name: 'Chanceux',
    repeatable: false,
    description:
      "Vous disposez de points de Chance égaux à votre bonus de maîtrise, récupérés au Repos long. Dépensez-en 1 pour vous donner un Avantage à un test de d20, ou pour imposer un Désavantage à une attaque qui vous vise.",
    effects: [
      {
        application: 'active',
        resource: {
          key: 'luckPoints',
          max: proficiencyBonus(),
          recovery: 'longRest',
        },
        trigger: { event: 'onD20Test', action: 'noAction' },
        note: "1 point : Avantage à un test de d20, ou Désavantage à une attaque qui vous vise.",
      },
    ],
  },
  {
    key: 'magic-initiate',
    name: 'Initié à la magie',
    repeatable: true,
    description:
      "Deux sorts mineurs et un sort de niveau 1 pris dans la liste du Clerc, du Druide ou du Magicien. Le sort de niveau 1 est toujours préparé et se lance une fois par Repos long sans emplacement.",
    effects: [
      {
        application: 'grant',
        grants: {
          spellcastingChoice: {
            kind: 'originFeat',
            abilityOptions: ['intelligence', 'wisdom', 'charisma'],
            spellListOptions: ['cleric', 'druid', 'wizard'],
            cantripsKnown: MAGIC_INITIATE_CANTRIPS,
            spellsPrepared: MAGIC_INITIATE_SPELLS,
            level1Slots: 0,
          },
        },
      },
      {
        application: 'informational',
        note: "Le sort de niveau 1 se lance gratuitement une fois par Repos long, ou avec un emplacement si vous en avez.",
      },
    ],
  },
  {
    key: 'musician',
    name: 'Musicien',
    repeatable: false,
    description:
      "Maîtrise de trois instruments de musique. À la fin d'un repos, vous pouvez jouer et donner une Inspiration héroïque à un nombre d'alliés égal à votre bonus de maîtrise.",
    effects: [
      {
        application: 'grant',
        grants: {
          toolChoice: { count: MUSICIAN_INSTRUMENT_COUNT, options: 'any' },
        },
      },
      {
        application: 'informational',
        note: "Chant d'encouragement : à la fin d'un repos, Inspiration héroïque à autant d'alliés que votre bonus de maîtrise.",
      },
    ],
  },
  {
    key: 'savage-attacker',
    name: 'Sauvagerie martiale',
    repeatable: false,
    description:
      "Une fois par tour, lorsque vous touchez avec une arme, vous lancez deux fois les dés de dégâts et gardez le résultat de votre choix.",
    effects: [
      {
        application: 'informational',
        note: 'Une fois par tour : relancer les dés de dégâts de l\'arme et garder le meilleur résultat.',
      },
    ],
  },
  {
    key: 'skilled',
    name: 'Doué',
    repeatable: true,
    description:
      "Vous maîtrisez n'importe quelle combinaison de trois compétences ou outils de votre choix.",
    effects: [
      {
        application: 'grant',
        grants: { skillOrToolChoiceCount: SKILLED_PROFICIENCY_COUNT },
      },
    ],
  },
  {
    key: 'tavern-brawler',
    name: 'Bagarreur de tavernes',
    repeatable: false,
    description:
      "Votre Frappe à mains nues inflige 1d4 plus votre modificateur de Force. Vous relancez les 1 sur ce dé, maîtrisez les armes improvisées, et pouvez repousser une cible de 1,50 m une fois par tour.",
    effects: [
      {
        application: 'passive',
        passive: {
          kind: 'set',
          target: 'unarmedDamage',
          dice: '1d4',
          formula: abilityMod('strength'),
        },
      },
      {
        application: 'informational',
        note: "Relancez les 1 sur le dé de dégâts de la Frappe à mains nues ; maîtrise des armes improvisées ; Bourrade de 1,50 m une fois par tour.",
      },
    ],
  },
  {
    key: 'tough',
    name: 'Robuste',
    repeatable: false,
    description:
      "Vos points de vie maximum augmentent de deux fois votre niveau, et de 2 points de plus à chaque niveau gagné ensuite.",
    effects: [
      {
        application: 'passive',
        passive: {
          kind: 'bonus',
          target: 'maxHp',
          formula: perLevel(TOUGH_HP_PER_LEVEL),
        },
      },
    ],
  },
];

export const ORIGIN_FEATS: Readonly<Record<OriginFeatKey, OriginFeat>> =
  Object.fromEntries(ORIGIN_FEAT_LIST.map((feat) => [feat.key, feat])) as Record<
    OriginFeatKey,
    OriginFeat
  >;
