import { describe, expect, it } from 'vitest';
import { DndCatalogSchema } from '@donjon-dragon/shared/dnd-catalog-schema';

import { ALIGNMENTS, ALIGNMENT_LABELS } from '../domain/character-identity';
import {
  MUSICAL_INSTRUMENTS,
  RARE_LANGUAGES,
  STANDARD_LANGUAGES,
} from '../domain/reference/creation-options';
import {
  weaponMasteryCount,
  weaponMasteryOptions,
} from '../domain/resolution/class-options';
import { DEFAULT_LANGUAGE, LANGUAGE_LABELS } from '../domain/reference/proficiencies';
import { toDndCatalog } from './dnd-catalog.mapper';

describe('toDndCatalog', () => {
  it('respecte son propre contrat', () => {
    expect(DndCatalogSchema.safeParse(toDndCatalog()).success).toBe(true);
  });

  /**
   * Comparer les ensembles, jamais les cardinaux : un doublon garderait le bon
   * compte tout en masquant une langue absente.
   */
  it('publie exactement les langues standards, sans doublon', () => {
    const published = toDndCatalog().languages.standard.map((entry) => entry.key);

    expect(new Set(published)).toEqual(new Set(STANDARD_LANGUAGES));
    expect(published).toHaveLength(new Set(published).size);
  });

  it('publie exactement les langues rares, sans doublon', () => {
    const published = toDndCatalog().languages.rare.map((entry) => entry.key);

    expect(new Set(published)).toEqual(new Set(RARE_LANGUAGES));
    expect(published).toHaveLength(new Set(published).size);
  });

  // Le Commun est accordé d'office : le proposer serait offrir un choix qui n'en
  // est pas un, et brûler l'un des deux emplacements du joueur.
  it('n’offre le Commun dans aucune des deux listes', () => {
    const { standard, rare } = toDndCatalog().languages;

    expect([...standard, ...rare].map((entry) => entry.key))
      .not.toContain(DEFAULT_LANGUAGE);
  });

  it('publie exactement les neuf alignements, sans doublon', () => {
    const published = toDndCatalog().alignments.map((entry) => entry.key);

    expect(new Set(published)).toEqual(new Set(ALIGNMENTS));
    expect(published).toHaveLength(new Set(published).size);
  });

  /**
   * Le créateur ouvre chaque fiche sur ce texte : une description vide laisserait
   * la fiche sans chapeau, sans que rien ne le signale.
   */
  it('décrit chaque espèce, classe, compétence, caractéristique et alignement', () => {
    const catalog = toDndCatalog();
    const described = [
      ...catalog.species, ...catalog.classes, ...catalog.skills, ...catalog.abilities, ...catalog.alignments,
    ];

    expect(described.filter((entry) => entry.description.trim() === '')).toEqual([]);
  });

  it('publie les dix-huit compétences avec la caractéristique de leur test', () => {
    const skills = toDndCatalog().skills;

    expect(skills).toHaveLength(18);
    expect(skills).toContainEqual(expect.objectContaining({ key: 'perception', name: 'Perception', ability: 'wisdom' }));
  });

  /**
   * Le wizard ne doit proposer QUE ce que la validation accepte. Ces bornes
   * sortent des mêmes fonctions que `validate-choices` : les publier depuis un
   * calcul parallèle les ferait diverger au premier errata.
   */
  it('publie les maîtrises d’armes exactement pour les cinq classes concernées', () => {
    const withMastery = toDndCatalog()
      .classes.filter((entry) => entry.weaponMastery)
      .map((entry) => entry.key);

    expect(new Set(withMastery)).toEqual(
      new Set(['barbarian', 'fighter', 'paladin', 'ranger', 'rogue']),
    );
  });

  it('borne chaque maîtrise aux armes que la classe manie', () => {
    const rogue = classNamed('rogue');

    expect(rogue.weaponMastery?.count).toBe(weaponMasteryCount('rogue'));
    expect(new Set(rogue.weaponMastery?.options)).toEqual(
      new Set(weaponMasteryOptions('rogue')),
    );
  });

  // `classes.ts` annonce « n'importe quel outil » ; la validation ne l'accepte
  // pas. C'est la validation qui fait foi, et le catalogue doit dire la même.
  it('n’offre au barde que des instruments, malgré « any »', () => {
    const bard = classNamed('bard');

    expect(bard.toolChoice?.count).toBe(3);
    expect(new Set(bard.toolChoice?.options)).toEqual(new Set(MUSICAL_INSTRUMENTS));
  });

  it('n’offre un choix d’outil qu’au barde et au moine', () => {
    const withTools = toDndCatalog()
      .classes.filter((entry) => entry.toolChoice)
      .map((entry) => entry.key);

    expect(new Set(withTools)).toEqual(new Set(['bard', 'monk']));
  });

  it('n’accorde la langue supplémentaire qu’au roublard', () => {
    const withLanguage = toDndCatalog()
      .classes.filter((entry) => entry.grantsLanguageChoice)
      .map((entry) => entry.key);

    expect(withLanguage).toEqual(['rogue']);
  });

  it('publie les outils au choix des cinq historiques concernés', () => {
    const withChoice = toDndCatalog()
      .backgrounds.filter((entry) => entry.toolOptions.length > 0)
      .map((entry) => entry.key);

    expect(new Set(withChoice)).toEqual(
      new Set(['artisan', 'entertainer', 'guard', 'noble', 'soldier']),
    );
  });

  it('laisse vide le choix d’outil des historiques qui l’imposent', () => {
    expect(backgroundNamed('farmer').toolOptions).toEqual([]);
    expect(backgroundNamed('farmer').toolProficiency).not.toBe('');
  });

  it('étiquette chaque clé publiée en français', () => {
    const catalog = toDndCatalog();

    [...catalog.languages.standard, ...catalog.languages.rare].forEach((entry) => {
      expect(entry.name).toBe(LANGUAGE_LABELS[entry.key]);
    });
    catalog.alignments.forEach((entry) => {
      expect(entry.name).toBe(ALIGNMENT_LABELS[entry.key]);
    });
    expect(Object.values(catalog.toolLabels).every(Boolean)).toBe(true);
    expect(Object.values(catalog.weaponLabels).every(Boolean)).toBe(true);
  });

  it('publie le choix concret du barde, du moine et du voyageur', () => {
    expect(classNamed('bard').startingEquipment.options[0]?.itemChoice).not.toBeNull();
    expect(classNamed('monk').startingEquipment.options[0]?.itemChoice).not.toBeNull();
    expect(backgroundNamed('wayfarer').equipment.options[0]?.itemChoice).not.toBeNull();
  });

  it('publie exactement cent babioles identifiées', () => {
    const trinkets = toDndCatalog().trinkets;

    expect(trinkets).toHaveLength(100);
    expect(new Set(trinkets.map((entry) => entry.id)).size).toBe(100);
    expect(trinkets[0]).toEqual({
      id: 1,
      itemKey: 'trinket-01',
      name: 'Une main de gobelin momifiée',
    });
    expect(trinkets[99]).toEqual({
      id: 100,
      itemKey: 'trinket-100',
      name: "Une urne en métal contenant les cendres d'un héros",
    });
    expect(trinkets.every((entry) => !entry.name.startsWith('Babiole '))).toBe(true);
  });

  it('publie les invocations et leurs sous-choix fermés', () => {
    const catalog = toDndCatalog();

    expect(catalog.invocations).toHaveLength(5);
    expect(catalog.familiarForms).toContainEqual({ key: 'owl', name: 'Owl' });
    expect(catalog.pactWeaponOptions.some((weapon) => weapon.key === 'longsword')).toBe(true);
    expect(catalog.pactWeaponOptions.some((weapon) => weapon.key === 'longbow')).toBe(false);
  });
});

function classNamed(key: string) {
  const found = toDndCatalog().classes.find((entry) => entry.key === key);
  if (!found) throw new Error(`Classe absente du catalogue : ${key}`);

  return found;
}

function backgroundNamed(key: string) {
  const found = toDndCatalog().backgrounds.find((entry) => entry.key === key);
  if (!found) throw new Error(`Historique absent du catalogue : ${key}`);

  return found;
}
