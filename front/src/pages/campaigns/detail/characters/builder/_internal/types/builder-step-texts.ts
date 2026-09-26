import type { BuilderStep } from "./builder-steps";

/**
 * L'aide affichée sous le titre de chaque étape. Un `Record` exhaustif : une
 * étape ajoutée sans son aide casse `tsc` plutôt que d'afficher un vide.
 */
export const STEP_HINTS: Record<BuilderStep, string> = {
  species: "Votre espèce détermine vos traits innés, votre vitesse et votre vision.",
  lineage: "Chaque lignage ajoute des traits et des sorts qui lui sont propres.",
  languages: "Vous parlez le Commun d'office. Choisissez deux langues standards de plus.",
  class: "La classe fixe votre dé de vie, vos maîtrises et vos aptitudes de niveau 1.",
  background: "Votre historique accorde un don d'origine, deux compétences, un outil et des bonus de caractéristiques.",
  backgroundTool: "Votre historique vous laisse choisir l'outil que vous maîtrisez.",
  classSkills: "Choisissez les compétences que votre classe vous apprend.",
  fightingStyle: "Votre Style de combat oriente votre façon de vous battre.",
  classOrder: "Votre Ordre précise la vocation de votre classe dès le niveau 1.",
  weaponMasteries: "Choisissez les armes dont vous exploitez la botte.",
  classTools: "Choisissez les outils ou instruments que votre classe vous apprend.",
  classLanguage: "Votre classe vous apprend une langue de plus, standard ou rare.",
  feats: "Vos dons d'origine, et les choix qu'ils vous demandent.",
  expertise: "Votre bonus de maîtrise est doublé pour les compétences choisies ici.",
  invocation: "Votre première manifestation occulte, et ce qu'elle vous fait choisir.",
  abilities: "Choisissez une méthode, fixez vos six scores, puis placez les bonus de votre historique.",
  cantrips: "Les sorts mineurs se lancent à volonté, sans emplacement de sort.",
  spells: "Préparez vos sorts de niveau 1. Ils changent après chaque Repos long.",
  equipment: "Le paquetage de votre classe et celui de votre historique, ou bien l'or.",
  identity: "Nom, alignement et apparence. C'est la dernière étape avant la fiche.",
};

const ABBREVIATION_LENGTH = 2;

const LETTER = /\p{L}/u;

/** Le médaillon d'une option : ses deux premières lettres, en capitales. */
export function abbreviationOf(name: string): string {
  return name.slice(0, ABBREVIATION_LENGTH).toUpperCase();
}

/**
 * Les médaillons d'une liste, deux à deux distincts : Barbare garde « BA », et
 * Barde, qui le suit, prend la lettre suivante de son nom — « BR ».
 */
export function distinctAbbreviationsOf(names: readonly string[]): string[] {
  return names.reduce<string[]>((taken, name) => [...taken, freeAbbreviationOf(name, taken)], []);
}

function freeAbbreviationOf(name: string, taken: readonly string[]): string {
  const [initial = "", ...rest] = [...name];
  const letters = rest.filter((letter) => LETTER.test(letter));
  const free = letters.find((letter) => !taken.includes(`${initial}${letter}`.toUpperCase()));

  return `${initial}${free ?? letters[0] ?? ""}`.toUpperCase();
}
