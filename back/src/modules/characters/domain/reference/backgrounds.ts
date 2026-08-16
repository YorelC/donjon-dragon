// Les 16 historiques de D&D 2024.
// Source : docs/characteres/backgrounds.json
//
// L'historique est la pièce centrale de la création en 2024 : c'est lui, et non
// l'espèce, qui porte les bonus de caractéristique, et c'est lui qui octroie le
// don d'Origines.
//
// Les clés de dons de la source étaient en camelCase (`magicInitiate`) là où
// feats.seed.json est en kebab-case (`magic-initiate`) ; c'est le kebab-case qui
// fait foi partout ici.

import type { Ability } from './abilities';
import type { BackgroundKey, ClassKey, OriginFeatKey } from './keys';
import type { SkillName } from './skills';
import { goldOnly, type StartingEquipment } from './starting-equipment';

/**
 * Les deux répartitions autorisées des trois caractéristiques de l'historique :
 * +2 sur l'une et +1 sur une autre, ou +1 sur chacune des trois.
 */
export const BACKGROUND_ABILITY_BONUS_PLANS = {
  focused: [2, 1],
  spread: [1, 1, 1],
} as const;

export type BackgroundAbilityBonusPlan = keyof typeof BACKGROUND_ABILITY_BONUS_PLANS;

export const BACKGROUND_ABILITY_COUNT = 3;

export interface Background {
  key: BackgroundKey;
  name: string;
  abilityBonuses: readonly [Ability, Ability, Ability];
  originFeat: OriginFeatKey;
  /**
   * Initié à la magie puise dans une liste précise selon l'historique : celle du
   * clerc pour l'Acolyte, du druide pour le Guide, du magicien pour le Sage.
   */
  originFeatSpellList?: ClassKey;
  skillProficiencies: readonly [SkillName, SkillName];
  toolProficiency: string;
  equipment: StartingEquipment;
  description: string;
}

/** L'option B de tous les historiques : renoncer au paquetage contre de l'or. */
const GOLD_ALTERNATIVE = 50;
const GOLD_OPTION = goldOnly('B', GOLD_ALTERNATIVE);

const BACKGROUND_LIST: readonly Background[] = [
  {
    key: 'acolyte',
    name: 'Acolyte',
    abilityBonuses: ['intelligence', 'wisdom', 'charisma'],
    originFeat: 'magic-initiate',
    originFeatSpellList: 'cleric',
    skillProficiencies: ['insight', 'religion'],
    toolProficiency: 'matériel de calligraphe',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Matériel de calligraphe, livre (prières), symbole sacré, parchemin (10 feuilles), robe, 8 po',
          entries: [
            { itemKey: 'materiel-de-calligraphe', quantity: 1 },
            { itemKey: 'livre', quantity: 1 },
            { itemKey: 'symbole-sacre', quantity: 1 },
            { itemKey: 'parchemin', quantity: 10 },
            { itemKey: 'robe', quantity: 1 },
          ],
          gold: 8,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous étiez au service d'un temple, en ville ou retiré dans un bosquet sacré. Vous y avez accompli des rites en l'honneur d'un dieu ou d'un panthéon. Vous avez servi un prêtre et étudié la religion.",
  },
  {
    key: 'artisan',
    name: 'Artisan',
    abilityBonuses: ['strength', 'dexterity', 'intelligence'],
    originFeat: 'crafter',
    skillProficiencies: ['investigation', 'persuasion'],
    toolProficiency: "choix d'outils d'artisan",
    // « Outils d'artisan » désigne une catégorie de dix-sept outils, pas un
    // objet : c'est l'étape des maîtrises qui tranche lequel. Le libellé le dit,
    // l'inventaire ne l'invente pas.
    equipment: {
      options: [
        {
          id: 'A',
          label: "Outils d'artisan, 2 sacoches, tenue de voyage, 32 po",
          entries: [
            { itemKey: 'sacoche', quantity: 2 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 32,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez fait votre apprentissage dans un atelier d'artisan, apprenant à créer vos propres objets et à charmer des clients exigeants. Ce métier vous a donné un sens aigu du détail.",
  },
  {
    key: 'charlatan',
    name: 'Charlatan',
    abilityBonuses: ['dexterity', 'constitution', 'charisma'],
    originFeat: 'skilled',
    skillProficiencies: ['sleightOfHand', 'deception'],
    toolProficiency: 'matériel de contrefaçon',
    equipment: {
      options: [
        {
          id: 'A',
          label: 'Matériel de contrefaçon, costume, beaux habits, 15 po',
          entries: [
            { itemKey: 'materiel-de-contrefacon', quantity: 1 },
            { itemKey: 'costume', quantity: 1 },
            { itemKey: 'beaux-habits', quantity: 1 },
          ],
          gold: 15,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "En parcourant les auberges, vous appreniez à exploiter les malheureux en quête d'un mensonge réconfortant — peut-être une potion magique ou de faux documents généalogiques.",
  },
  {
    key: 'criminal',
    name: 'Criminel',
    abilityBonuses: ['dexterity', 'constitution', 'intelligence'],
    originFeat: 'alert',
    skillProficiencies: ['sleightOfHand', 'stealth'],
    toolProficiency: 'outils de voleur',
    equipment: {
      options: [
        {
          id: 'A',
          label: '2 dagues, outils de voleur, pied-de-biche, 2 sacoches, tenue de voyage, 16 po',
          entries: [
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'outils-de-voleur', quantity: 1 },
            { itemKey: 'pied-de-biche', quantity: 1 },
            { itemKey: 'sacoche', quantity: 2 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 16,
        },
        GOLD_OPTION,
      ],
    },
    description:
      'Vous gagniez péniblement votre vie dans de sombres ruelles, coupant des bourses ou cambriolant des boutiques.',
  },
  {
    key: 'entertainer',
    name: 'Artiste',
    abilityBonuses: ['strength', 'dexterity', 'charisma'],
    originFeat: 'musician',
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiency: "choix d'instrument de musique",
    equipment: {
      options: [
        {
          id: 'A',
          label: 'Instrument de musique, 2 costumes, miroir, parfum, tenue de voyage, 11 po',
          entries: [
            { itemKey: 'instrument-de-musique', quantity: 1 },
            { itemKey: 'costume', quantity: 2 },
            { itemKey: 'miroir', quantity: 1 },
            { itemKey: 'parfum', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 11,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez suivi les fêtes foraines et les carnavals itinérants, enchaînant les petits boulots en échange de leçons. Vous vous épanouissez sous les applaudissements.",
  },
  {
    key: 'farmer',
    name: 'Fermier',
    abilityBonuses: ['strength', 'constitution', 'wisdom'],
    originFeat: 'tough',
    skillProficiencies: ['animalHandling', 'nature'],
    toolProficiency: 'outils de charpentier',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Serpe, outils de charpentier, trousse de soins, pot en fer, pelle, tenue de voyage, 30 po',
          entries: [
            { itemKey: 'sickle', quantity: 1 },
            { itemKey: 'outils-de-charpentier', quantity: 1 },
            { itemKey: 'trousse-de-soins', quantity: 1 },
            { itemKey: 'pot-en-fer', quantity: 1 },
            { itemKey: 'pelle', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 30,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Des années passées à prendre soin des animaux et à cultiver la terre vous ont procuré patience et une excellente santé.",
  },
  {
    key: 'guard',
    name: 'Garde',
    abilityBonuses: ['strength', 'intelligence', 'wisdom'],
    originFeat: 'alert',
    skillProficiencies: ['athletics', 'perception'],
    toolProficiency: 'choix de boîte de jeux',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Lance, arbalète légère, 20 carreaux, boîte de jeux, lanterne à capote, menottes, carquois, tenue de voyage, 12 po',
          entries: [
            { itemKey: 'spear', quantity: 1 },
            { itemKey: 'light-crossbow', quantity: 1 },
            { itemKey: 'munitions', quantity: 20 },
            { itemKey: 'boite-de-jeux', quantity: 1 },
            { itemKey: 'lanterne-capote', quantity: 1 },
            { itemKey: 'menottes', quantity: 1 },
            { itemKey: 'carquois', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 12,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous étiez entraîné à garder un œil sur l'extérieur des murs, guettant les maraudeurs, et l'autre sur l'intérieur, à la recherche de fauteurs de troubles.",
  },
  {
    key: 'guide',
    name: 'Guide',
    abilityBonuses: ['dexterity', 'constitution', 'wisdom'],
    originFeat: 'magic-initiate',
    originFeatSpellList: 'druid',
    skillProficiencies: ['stealth', 'survival'],
    toolProficiency: 'outils de cartographe',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Arc court, 20 flèches, outils de cartographe, sac de couchage, carquois, tente, tenue de voyage, 3 po',
          entries: [
            { itemKey: 'shortbow', quantity: 1 },
            { itemKey: 'munitions', quantity: 20 },
            { itemKey: 'outils-de-cartographe', quantity: 1 },
            { itemKey: 'sac-de-couchage', quantity: 1 },
            { itemKey: 'carquois', quantity: 1 },
            { itemKey: 'tente', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 3,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez grandi en pleine nature. De temps à autre, vous guidiez des prêtres bienveillants qui vous enseignaient les rudiments de la canalisation de la magie sauvage.",
  },
  {
    key: 'hermit',
    name: 'Ermite',
    abilityBonuses: ['constitution', 'wisdom', 'charisma'],
    originFeat: 'healer',
    skillProficiencies: ['medicine', 'religion'],
    toolProficiency: "matériel d'herboriste",
    equipment: {
      options: [
        {
          id: 'A',
          label:
            "Bâton de combat, matériel d'herboriste, sac de couchage, livre (philosophie), lampe, huile (3 flasques), tenue de voyage, 16 po",
          entries: [
            { itemKey: 'quarterstaff', quantity: 1 },
            { itemKey: 'materiel-herboriste', quantity: 1 },
            { itemKey: 'sac-de-couchage', quantity: 1 },
            { itemKey: 'livre', quantity: 1 },
            { itemKey: 'lampe', quantity: 1 },
            { itemKey: 'huile', quantity: 3 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 16,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez passé votre enfance reclus dans une hutte ou un monastère. Cette solitude vous permettait de méditer sur les mystères de la création.",
  },
  {
    key: 'merchant',
    name: 'Marchand',
    abilityBonuses: ['constitution', 'intelligence', 'charisma'],
    originFeat: 'lucky',
    skillProficiencies: ['animalHandling', 'persuasion'],
    toolProficiency: 'instruments de navigateur',
    equipment: {
      options: [
        {
          id: 'A',
          label: 'Instruments de navigateur, 2 sacoches, tenue de voyage, 22 po',
          entries: [
            { itemKey: 'instruments-de-navigateur', quantity: 1 },
            { itemKey: 'sacoche', quantity: 2 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 22,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez fait votre apprentissage chez un marchand ou un caravanier. Vous avez beaucoup voyagé et gagné votre vie en achetant et en vendant.",
  },
  {
    key: 'noble',
    name: 'Noble',
    abilityBonuses: ['strength', 'intelligence', 'charisma'],
    originFeat: 'skilled',
    skillProficiencies: ['history', 'persuasion'],
    toolProficiency: 'choix de boîte de jeux',
    equipment: {
      options: [
        {
          id: 'A',
          label: 'Boîte de jeux, beaux habits, parfum, 29 po',
          entries: [
            { itemKey: 'boite-de-jeux', quantity: 1 },
            { itemKey: 'beaux-habits', quantity: 1 },
            { itemKey: 'parfum', quantity: 1 },
          ],
          gold: 29,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez grandi dans un château, entouré de richesse et de privilèges. Les heures passées à observer votre famille à la cour vous ont beaucoup appris sur l'autorité.",
  },
  {
    key: 'sage',
    name: 'Sage',
    abilityBonuses: ['constitution', 'intelligence', 'wisdom'],
    originFeat: 'magic-initiate',
    originFeatSpellList: 'wizard',
    skillProficiencies: ['arcana', 'history'],
    toolProficiency: 'matériel de calligraphe',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Bâton de combat, matériel de calligraphe, livre (histoire), parchemin (8 feuilles), robe, 8 po',
          entries: [
            { itemKey: 'quarterstaff', quantity: 1 },
            { itemKey: 'materiel-de-calligraphe', quantity: 1 },
            { itemKey: 'livre', quantity: 1 },
            { itemKey: 'parchemin', quantity: 8 },
            { itemKey: 'robe', quantity: 1 },
          ],
          gold: 8,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez voyagé entre manoirs et monastères en échange d'un accès à leurs bibliothèques, engrangeant des connaissances sur le multivers et des rudiments de magie.",
  },
  {
    key: 'sailor',
    name: 'Marin',
    abilityBonuses: ['strength', 'dexterity', 'wisdom'],
    originFeat: 'tavern-brawler',
    skillProficiencies: ['acrobatics', 'perception'],
    toolProficiency: 'instruments de navigateur',
    equipment: {
      options: [
        {
          id: 'A',
          label: 'Dague, instruments de navigateur, corde, tenue de voyage, 20 po',
          entries: [
            { itemKey: 'dagger', quantity: 1 },
            { itemKey: 'instruments-de-navigateur', quantity: 1 },
            { itemKey: 'corde', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 20,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez vécu le vent dans le dos et le pont qui tanguait sous vos pieds, affronté de terribles tempêtes et échangé des histoires dans d'innombrables ports.",
  },
  {
    key: 'scribe',
    name: 'Scribe',
    abilityBonuses: ['dexterity', 'intelligence', 'wisdom'],
    originFeat: 'skilled',
    skillProficiencies: ['investigation', 'perception'],
    toolProficiency: 'matériel de calligraphe',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Matériel de calligraphe, beaux habits, lampe, huile (3 flasques), parchemin (12 feuilles), 23 po',
          entries: [
            { itemKey: 'materiel-de-calligraphe', quantity: 1 },
            { itemKey: 'beaux-habits', quantity: 1 },
            { itemKey: 'lampe', quantity: 1 },
            { itemKey: 'huile', quantity: 3 },
            { itemKey: 'parchemin', quantity: 12 },
          ],
          gold: 23,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez appris à écrire d'une main lisible dans un scriptorium. Vous avez le souci du détail, ce qui vous évite les erreurs dans les documents que vous copiez.",
  },
  {
    key: 'soldier',
    name: 'Soldat',
    abilityBonuses: ['strength', 'dexterity', 'constitution'],
    originFeat: 'savage-attacker',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiency: 'choix de jeu',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            'Lance, arc court, 20 flèches, jeu, trousse de soins, carquois, tenue de voyage, 14 po',
          entries: [
            { itemKey: 'spear', quantity: 1 },
            { itemKey: 'shortbow', quantity: 1 },
            { itemKey: 'munitions', quantity: 20 },
            { itemKey: 'boite-de-jeux', quantity: 1 },
            { itemKey: 'trousse-de-soins', quantity: 1 },
            { itemKey: 'carquois', quantity: 1 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 14,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous vous êtes entraîné à la guerre dès l'âge adulte. Le combat est dans votre sang, et vous avez mis cet entraînement en pratique sur le champ de bataille.",
  },
  {
    key: 'wayfarer',
    name: 'Voyageur',
    abilityBonuses: ['dexterity', 'wisdom', 'charisma'],
    originFeat: 'lucky',
    skillProficiencies: ['stealth', 'insight'],
    toolProficiency: 'outils de voleur',
    equipment: {
      options: [
        {
          id: 'A',
          label:
            '2 dagues, outils de voleur, boîte de jeux, sac de couchage, 2 sacoches, tenue de voyage, 16 po',
          entries: [
            { itemKey: 'dagger', quantity: 2 },
            { itemKey: 'outils-de-voleur', quantity: 1 },
            { itemKey: 'boite-de-jeux', quantity: 1 },
            { itemKey: 'sac-de-couchage', quantity: 1 },
            { itemKey: 'sacoche', quantity: 2 },
            { itemKey: 'tenue-de-voyage', quantity: 1 },
          ],
          gold: 16,
        },
        GOLD_OPTION,
      ],
    },
    description:
      "Vous avez grandi dans la rue, dormant où vous pouviez. Vous n'avez jamais perdu votre fierté ni votre espoir : le destin n'a pas encore dit son dernier mot.",
  },
];

export const BACKGROUNDS: Readonly<Record<BackgroundKey, Background>> =
  Object.fromEntries(
    BACKGROUND_LIST.map((background) => [background.key, background]),
  ) as Record<BackgroundKey, Background>;
