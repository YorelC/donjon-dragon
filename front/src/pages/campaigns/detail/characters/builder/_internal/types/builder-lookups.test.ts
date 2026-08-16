import { describe, it, expect } from "vitest";
import type {
  CatalogBackground,
  CatalogClass,
  CatalogOriginFeat,
  DndCatalog,
} from "@donjon-dragon/shared";
import { EMPTY_COMPOSITION } from "./character-composition";
import { cantripQuotaOf, classCantripsOf, type StepContext } from "./builder-lookups";

/**
 * Le scénario du bug : un clerc qui prend l'Ordre divin Thaumaturge et
 * l'historique Acolyte, lequel apporte Initié à la magie.
 *
 * L'étape annonçait six sorts mineurs, le sélecteur n'en proposait que cinq, et
 * le bouton « suivant » restait bloqué faute du compte attendu.
 */

const CLERIC_CANTRIPS = 3;
const THAUMATURGE_BONUS = 1;
const MAGIC_INITIATE_CANTRIPS = 2;

const DIVINE_ORDER = "divineOrder";
const THAUMATURGE = "thaumaturge";
const PROTECTOR = "protector";

function aCleric(): CatalogClass {
  return {
    key: "cleric",
    name: "Clerc",
    spellcasting: { cantripsKnown: CLERIC_CANTRIPS, spellsPrepared: 4 },
    level1Choices: [
      {
        key: DIVINE_ORDER,
        label: "Ordre divin",
        options: [
          { key: PROTECTOR, name: "Protecteur", description: "" },
          { key: THAUMATURGE, name: "Thaumaturge", description: "" },
        ],
      },
    ],
  } as unknown as CatalogClass;
}

function aMagicInitiate(): CatalogOriginFeat {
  return {
    key: "magic-initiate",
    name: "Initié à la magie",
    spellcastingChoice: { cantripsKnown: MAGIC_INITIATE_CANTRIPS, spellsPrepared: 1 },
  } as unknown as CatalogOriginFeat;
}

function anAcolyte(): CatalogBackground {
  return { key: "acolyte", name: "Acolyte", originFeat: "magic-initiate" } as unknown as CatalogBackground;
}

function aContext(classOrder: string | null): StepContext {
  return {
    catalog: {
      classes: [aCleric()],
      backgrounds: [anAcolyte()],
      originFeats: [aMagicInitiate()],
      species: [],
      skillLabels: {},
    } as unknown as DndCatalog,
    composition: {
      ...EMPTY_COMPOSITION,
      classKey: "cleric",
      backgroundKey: "acolyte",
      classOrder,
    },
  };
}

describe("classCantripsOf", () => {
  it("ajoute le sort mineur de l'Ordre divin Thaumaturge", () => {
    expect(classCantripsOf(aContext(THAUMATURGE))).toBe(CLERIC_CANTRIPS + THAUMATURGE_BONUS);
  });

  it("n'ajoute rien pour un Ordre divin non mystique", () => {
    expect(classCantripsOf(aContext(PROTECTOR))).toBe(CLERIC_CANTRIPS);
  });

  it("n'ajoute rien tant qu'aucun Ordre n'est choisi", () => {
    expect(classCantripsOf(aContext(null))).toBe(CLERIC_CANTRIPS);
  });
});

describe("cantripQuotaOf", () => {
  /**
   * La régression : le sélecteur et l'étape doivent annoncer le même compte,
   * sans quoi la création se bloque.
   */
  it("compte l'Ordre mystique et le don ensemble", () => {
    const context = aContext(THAUMATURGE);

    expect(cantripQuotaOf(context)).toBe(
      CLERIC_CANTRIPS + THAUMATURGE_BONUS + MAGIC_INITIATE_CANTRIPS,
    );
    expect(cantripQuotaOf(context)).toBe(classCantripsOf(context) + MAGIC_INITIATE_CANTRIPS);
  });
});
