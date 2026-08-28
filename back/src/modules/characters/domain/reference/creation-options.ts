import type { BackgroundKey } from './keys';
import type { Language } from './proficiencies';

export const STANDARD_LANGUAGES: readonly Language[] = [
  'commonSignLanguage',
  'draconic',
  'dwarvish',
  'elvish',
  'giant',
  'gnomish',
  'goblin',
  'halfling',
  'orc',
];

export const RARE_LANGUAGES: readonly Language[] = [
  'abyssal',
  'celestial',
  'deepSpeech',
  'infernal',
  'primordial',
  'sylvan',
  'undercommon',
];

export const ARTISAN_TOOLS = [
  'alchemists-supplies',
  'brewers-supplies',
  'calligraphers-supplies',
  'carpenters-tools',
  'cartographers-tools',
  'cobblers-tools',
  'cooks-utensils',
  'glassblowers-tools',
  'jewelers-tools',
  'leatherworkers-tools',
  'masons-tools',
  'painters-supplies',
  'potters-tools',
  'smiths-tools',
  'tinkers-tools',
  'weavers-tools',
  'woodcarvers-tools',
] as const;

export const MUSICAL_INSTRUMENTS = [
  'bagpipes',
  'drum',
  'dulcimer',
  'flute',
  'horn',
  'lute',
  'lyre',
  'pan-flute',
  'shawm',
  'viol',
] as const;

export const GAMING_SETS = [
  'dice-set',
  'dragonchess-set',
  'playing-card-set',
  'three-dragon-ante-set',
] as const;

export const OTHER_TOOLS = [
  'disguise-kit',
  'forgery-kit',
  'herbalism-kit',
  'navigators-tools',
  'poisoners-kit',
  'thieves-tools',
] as const;

export const ALL_CONCRETE_TOOLS = [
  ...ARTISAN_TOOLS,
  ...MUSICAL_INSTRUMENTS,
  ...GAMING_SETS,
  ...OTHER_TOOLS,
] as const;

export const BACKGROUND_FIXED_TOOLS: Readonly<Record<BackgroundKey, string | null>> = {
  acolyte: 'calligraphers-supplies',
  artisan: null,
  charlatan: 'forgery-kit',
  criminal: 'thieves-tools',
  entertainer: null,
  farmer: 'carpenters-tools',
  guard: null,
  guide: 'cartographers-tools',
  hermit: 'herbalism-kit',
  merchant: 'navigators-tools',
  noble: null,
  sage: 'calligraphers-supplies',
  sailor: 'navigators-tools',
  scribe: 'calligraphers-supplies',
  soldier: null,
  wayfarer: 'thieves-tools',
};

export const LEVEL_ONE_INVOCATIONS = [
  'armor-of-shadows',
  'eldritch-mind',
  'pact-of-the-chain',
  'pact-of-the-blade',
  'pact-of-the-tome',
] as const;

export const SPECIAL_FAMILIAR_FORMS = [
  'imp',
  'pseudodragon',
  'quasit',
  'skeleton',
  'slaad-tadpole',
  'sphinx-of-wonder',
  'sprite',
  'venomous-snake',
] as const;

const TOOL_LABELS: Readonly<Record<string, string>> = {
  'alchemists-supplies': "Matériel d'alchimiste",
  'brewers-supplies': 'Matériel de brasseur',
  'calligraphers-supplies': 'Matériel de calligraphe',
  'carpenters-tools': 'Outils de charpentier',
  'cartographers-tools': 'Outils de cartographe',
  'cobblers-tools': 'Outils de cordonnier',
  'cooks-utensils': 'Ustensiles de cuisinier',
  'glassblowers-tools': 'Outils de souffleur de verre',
  'jewelers-tools': 'Outils de joaillier',
  'leatherworkers-tools': 'Outils de tanneur',
  'masons-tools': 'Outils de maçon',
  'painters-supplies': 'Matériel de peintre',
  'potters-tools': 'Outils de potier',
  'smiths-tools': 'Outils de forgeron',
  'tinkers-tools': 'Outils de bricoleur',
  'weavers-tools': 'Outils de tisserand',
  'woodcarvers-tools': 'Outils de menuisier',
  bagpipes: 'Cornemuse', drum: 'Tambour', dulcimer: 'Tympanon', flute: 'Flûte',
  horn: 'Cor', lute: 'Luth', lyre: 'Lyre', 'pan-flute': 'Flûte de pan',
  shawm: 'Chalemie', viol: 'Viole',
  'dice-set': 'Jeu de dés', 'dragonchess-set': 'Échecs draconiques',
  'playing-card-set': 'Cartes à jouer', 'three-dragon-ante-set': 'Jeu des dragons',
  'disguise-kit': 'Accessoires de déguisement', 'forgery-kit': 'Matériel de contrefaçon',
  'herbalism-kit': "Matériel d'herboriste", 'navigators-tools': 'Instruments de navigateur',
  'poisoners-kit': "Matériel d'empoisonneur", 'thieves-tools': 'Outils de voleur',
};

const TRINKET_PREFIX = 'trinket-';
const TRINKET_COUNT = 100;

export function trinketKey(id: number): string {
  return `${TRINKET_PREFIX}${id.toString().padStart(2, '0')}`;
}

export function isTrinketId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= TRINKET_COUNT;
}

export function creationItemName(key: string): string | null {
  if (key in TOOL_LABELS) return TOOL_LABELS[key] ?? null;
  if (!key.startsWith(TRINKET_PREFIX)) return null;
  return `Babiole ${key.slice(TRINKET_PREFIX.length)}`;
}

export function creationVirtualItems(): { key: string; name: string }[] {
  const tools = Object.entries(TOOL_LABELS).map(([key, name]) => ({ key, name }));
  const trinkets = Array.from({ length: TRINKET_COUNT }, (_, index) => {
    const key = trinketKey(index + 1);
    return { key, name: creationItemName(key) ?? key };
  });
  return [...tools, ...trinkets];
}
