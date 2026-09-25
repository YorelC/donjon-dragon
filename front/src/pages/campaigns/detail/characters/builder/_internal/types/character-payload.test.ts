import { describe, it, expect } from "vitest";
import {
  CreateCharacterSchema,
  FinalizeCharacterSchema,
  PreviewCharacterSheetSchema,
} from "@donjon-dragon/shared";
import { aCatalog, aSpeciesWithSizeChoice } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import {
  defaultMeasurementsOf,
  positiveIntegerFieldValue,
  positiveNumberFieldValue,
} from "./identity-fields";
import { toCreatePayload, toEditPayload, toPreviewPayload } from "./character-payload";

const CATALOG = aCatalog();

/**
 * Le seul endroit du dépôt où la sortie du wizard rencontre le contrat partagé.
 *
 * Sans ce test, le front a pu perdre l'état civil, le gabarit et les langues le
 * jour où le contrat les a exigés : plus rien ne créait de personnage, et rien
 * ne le disait. C'est le test qui doit tomber en premier si ça se reproduit.
 */
function aCompleteComposition(): CharacterComposition {
  return {
    ...EMPTY_COMPOSITION,
    name: "Frodo Sacquet",
    alignment: "neutralGood",
    age: 33,
    heightCm: 140,
    weightKg: 70,
    speciesKey: "dwarf",
    standardLanguages: ["elvish", "dwarvish"],
    classKey: "cleric",
    backgroundKey: "acolyte",
    backgroundBonuses: { wisdom: 2, charisma: 1 },
    assignment: {
      strength: 0, dexterity: 1, constitution: 2,
      intelligence: 3, wisdom: 4, charisma: 5,
    },
    classEquipmentOptionId: "A",
    backgroundEquipmentOptionId: "A",
  };
}

describe("le wizard produit un corps que le serveur accepte", () => {
  it("satisfait le contrat de création", () => {
    const payload = toCreatePayload(CATALOG, aCompleteComposition());

    expect(CreateCharacterSchema.safeParse(payload).success).toBe(true);
  });

  it("satisfait le contrat d’édition", () => {
    const payload = toEditPayload(CATALOG, aCompleteComposition(), 0);

    expect(FinalizeCharacterSchema.safeParse(payload).success).toBe(true);
  });

  it("satisfait le contrat d’aperçu", () => {
    const payload = toPreviewPayload(CATALOG, aCompleteComposition());

    expect(PreviewCharacterSheetSchema.safeParse(payload).success).toBe(true);
  });

  it("transporte les deux langues, jamais le gabarit que le serveur calcule", () => {
    const payload = toCreatePayload(CATALOG, aCompleteComposition());

    expect(payload).toMatchObject({ standardLanguages: ["elvish", "dwarvish"] });
    expect(payload).not.toHaveProperty("size");
  });

  // L'édition ne redésigne jamais de tirage : le personnage garde le sien.
  it("n’envoie aucun tirage à l’édition", () => {
    const composition = { ...aCompleteComposition(), abilityRollId: "un-tirage" };

    expect(toEditPayload(CATALOG, composition, 0)?.abilityRollId).toBeNull();
  });
});

describe("les deux frontières, et pourquoi elles diffèrent", () => {
  /**
   * L'aperçu exige l'origine, pas l'état civil : `PreviewCharacterSheetSchema`
   * n'applique que `requireCompleteOrigin`. Un joueur doit voir sa fiche bien
   * avant d'avoir choisi son âge — sinon le wizard n'affiche rien jusqu'au bout.
   */
  it.each(["alignment", "age", "heightCm", "weightKg"] as const)(
    "sans %s : pas de création, mais l’aperçu répond quand même",
    (field) => {
      const composition = { ...aCompleteComposition(), [field]: null };

      expect(toCreatePayload(CATALOG, composition)).toBeNull();
      expect(toPreviewPayload(CATALOG, composition)).not.toBeNull();
    },
  );

  it("sans nom : pas de création, mais l’aperçu répond quand même", () => {
    const composition = { ...aCompleteComposition(), name: "   " };

    expect(toCreatePayload(CATALOG, composition)).toBeNull();
    expect(toPreviewPayload(CATALOG, composition)).not.toBeNull();
  });

  it("sans les deux langues, ni création ni aperçu", () => {
    const composition = { ...aCompleteComposition(), standardLanguages: ["elvish" as const] };

    expect(toPreviewPayload(CATALOG, composition)).toBeNull();
    expect(toCreatePayload(CATALOG, composition)).toBeNull();
  });

  it("sans bornes d’espèce connues, pas de création", () => {
    const catalog = aCatalog({ species: [] });

    expect(toCreatePayload(catalog, aCompleteComposition())).toBeNull();
  });

  it("hors des bornes de l’espèce, pas de création, mais l’aperçu répond", () => {
    const composition = { ...aCompleteComposition(), heightCm: 200 };

    expect(toCreatePayload(CATALOG, composition)).toBeNull();
    expect(toPreviewPayload(CATALOG, composition)).not.toBeNull();
  });
});

describe("l’aperçu d’une espèce P/M", () => {
  const catalog = aCatalog({ species: [aSpeciesWithSizeChoice("human")] });
  const human = { ...aCompleteComposition(), speciesKey: "human" as const };

  it("répond avant que la taille physique soit saisie", () => {
    const payload = toPreviewPayload(catalog, { ...human, heightCm: null });

    expect(payload).not.toBeNull();
    expect(payload).not.toHaveProperty("heightCm");
  });

  it("transmet la taille physique dès qu’elle existe, pour que le serveur en déduise le gabarit", () => {
    expect(toPreviewPayload(catalog, { ...human, heightCm: 100 })).toMatchObject({ heightCm: 100 });
  });
});

describe("mesures par défaut d’une espèce", () => {
  it("prend le milieu de chaque plage, arrondi à l’inférieur", () => {
    const bounds = {
      heightCm: { min: 213, max: 244 },
      weightKg: { min: 93, max: 200 },
      mediumFromHeightCm: null,
    };

    expect(defaultMeasurementsOf(bounds)).toEqual({ heightCm: 228, weightKg: 146 });
  });
});

describe("conversion des champs numériques", () => {
  it.each(["", "   ", "abc", "0", "-3"])("refuse « %s »", (raw) => {
    expect(positiveNumberFieldValue(raw)).toBeNull();
    expect(positiveIntegerFieldValue(raw)).toBeNull();
  });

  // `Number("")` vaut zéro et `Number("abc")` vaut NaN : les deux entreraient
  // dans la composition sans cette conversion, et le serveur répondrait 400.
  it("n’écrit jamais zéro ni NaN dans la composition", () => {
    expect(positiveNumberFieldValue("")).not.toBe(0);
    expect(Number.isNaN(positiveNumberFieldValue("abc") as number)).toBe(false);
  });

  it("accepte une taille décimale, refuse un âge décimal", () => {
    expect(positiveNumberFieldValue("96.5")).toBe(96.5);
    expect(positiveIntegerFieldValue("33.5")).toBeNull();
    expect(positiveIntegerFieldValue("33")).toBe(33);
  });
});
