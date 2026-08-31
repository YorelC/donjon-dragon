import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  aCatalog,
  aSpecies,
  aSpeciesWithMagicalLineage,
  aSpeciesWithSizeChoice,
} from "../types/catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "../types/character-composition";
import { SpeciesStepView } from "./species-step.view";

const HUMAN = aSpeciesWithSizeChoice("human");
const GOLIATH = aSpeciesWithSizeChoice("goliath");
const DWARF = aSpecies({ key: "dwarf", name: "dwarf" });
const ELF = aSpeciesWithMagicalLineage("elf");

function renderStep(composition: Partial<CharacterComposition>) {
  const onChange = vi.fn();
  render(
    <SpeciesStepView
      catalog={aCatalog({ species: [HUMAN, GOLIATH, DWARF, ELF] })}
      composition={{ ...EMPTY_COMPOSITION, ...composition }}
      onChange={onChange}
    />,
  );

  return onChange;
}

describe("choix du gabarit", () => {
  it("n’apparaît que pour une espèce qui en offre un", () => {
    renderStep({ speciesKey: "dwarf" });

    expect(screen.queryByText("Gabarit")).not.toBeInTheDocument();
  });

  it("apparaît quand l’espèce admet deux tailles", () => {
    renderStep({ speciesKey: "human" });

    expect(screen.getByText("Gabarit")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /petite/i })).toBeInTheDocument();
  });
});

/**
 * Le reset, prouvé pour lui-même et non à travers `resolvedSizeOf` : les deux
 * mécanismes se doublent volontairement, et un test qui les mélange laisserait
 * passer la disparition de l'un.
 */
/**
 * Le reset est destructeur par nature : il faut donc qu'il ne se déclenche QUE
 * sur un vrai changement. `OptionListView` appelait `onSelect` même sur la carte
 * déjà retenue — un re-clic, ou une touche Entrée, effaçait gabarit, lignage,
 * don et tous les choix associés sans que rien ne change par ailleurs.
 */
describe("resélectionner la même espèce ne change rien", () => {
  it("ne mute rien quand on reclique sur l’espèce courante", async () => {
    const onChange = renderStep({
      speciesKey: "human",
      selectedSize: "Small",
      speciesFeat: "skilled",
      speciesSkills: ["arcana"],
      featSkills: ["history"],
    });

    await userEvent.click(screen.getByRole("radio", { name: "human" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ne mute rien non plus à la touche Entrée", async () => {
    const onChange = renderStep({ speciesKey: "human", selectedSize: "Small" });

    screen.getByRole("radio", { name: "human" }).focus();
    await userEvent.keyboard("{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("changer d’espèce périme ses choix", () => {
  it.each(["goliath", "dwarf"])(
    "remet le gabarit à zéro en passant à %s",
    async (target) => {
      const onChange = renderStep({ speciesKey: "human", selectedSize: "Small" });

      await userEvent.click(screen.getByRole("radio", { name: target }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ speciesKey: target, selectedSize: null }),
      );
    },
  );

  // Small reste légal pour le goliath : c'est la DÉCISION qui est périmée, pas
  // la valeur. Un choix hérité d'une autre espèce n'en est pas un.
  it("remet à zéro même quand la taille resterait autorisée", async () => {
    const onChange = renderStep({ speciesKey: "human", selectedSize: "Small" });

    await userEvent.click(screen.getByRole("radio", { name: "goliath" }));

    expect(onChange.mock.calls[0]?.[0]).toMatchObject({ selectedSize: null });
  });

  it("périme aussi le lignage et les compétences d’espèce", async () => {
    const onChange = renderStep({ speciesKey: "human" });

    await userEvent.click(screen.getByRole("radio", { name: "dwarf" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ lineageKey: null, speciesSkills: [] }),
    );
  });

  /**
   * Le cas sans issue : seul l'humain fait choisir un don d'origine. Conservé
   * après un passage au nain, ce don part au serveur au nom du nain — qui le
   * refuse — et AUCUN écran ne s'affiche pour le retirer, l'étape des dons ne
   * rendant ce choix que pour l'humain.
   */
  it("périme le don d’origine, que la nouvelle espèce n’a aucun moyen d’effacer", async () => {
    const onChange = renderStep({ speciesKey: "human", speciesFeat: "skilled" });

    await userEvent.click(screen.getByRole("radio", { name: "dwarf" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ speciesFeat: null }),
    );
  });

  /**
   * Le don parti, ses choix restent orphelins : le modèle ne dit pas de quel
   * don viennent `featSkills` et consorts. On les efface avec lui — ils se
   * ressaisissent, alors qu'un orphelin bloquerait la création.
   */
  it("emporte les choix que ce don avait fait faire", async () => {
    const onChange = renderStep({
      speciesKey: "human",
      speciesFeat: "skilled",
      featSkills: ["arcana", "history"],
      spellList: "wizard",
      spellcastingAbility: "intelligence",
    });

    await userEvent.click(screen.getByRole("radio", { name: "dwarf" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        featSkills: [],
        spellList: null,
        spellcastingAbility: null,
      }),
    );
  });

  // Sans don d'espèce, rien n'est orphelin : ce que l'HISTORIQUE a fait choisir
  // reste valide, et le joueur ne doit pas le ressaisir pour avoir comparé deux
  // espèces.
  it("laisse intacts les choix du don d’historique", async () => {
    const onChange = renderStep({
      speciesKey: "elf",
      speciesFeat: null,
      featSkills: ["arcana"],
      spellList: "cleric",
    });

    await userEvent.click(screen.getByRole("radio", { name: "dwarf" }));

    const patch = onChange.mock.calls[0]?.[0] ?? {};
    expect(patch).not.toHaveProperty("featSkills");
    expect(patch).not.toHaveProperty("spellList");
  });

  /**
   * Même piège pour un lignage magique abandonné : le nain n'a pas de lignage,
   * donc pas d'écran où retirer la caractéristique d'incantation héritée.
   */
  it("périme la caractéristique d’incantation en quittant un lignage magique", async () => {
    const onChange = renderStep({
      speciesKey: "elf",
      lineageKey: "drow",
      lineageSpellcastingAbility: "charisma",
    });

    await userEvent.click(screen.getByRole("radio", { name: "dwarf" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ lineageSpellcastingAbility: null }),
    );
  });
});
