import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CatalogOriginFeat } from "@donjon-dragon/shared";
import { aBackground, aCatalog, aSpecies } from "../types/catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "../types/character-composition";
import { FeatsStepView } from "./feats-step.view";

function aFeat(key: CatalogOriginFeat["key"], name: string, toolChoiceCount = 0): CatalogOriginFeat {
  return {
    key, name, description: "", repeatable: false, spellcastingChoice: null,
    skillOrToolChoiceCount: 0, toolChoiceCount,
    toolOptions: toolChoiceCount > 0 ? ["lute", "lyre", "flute", "drum"] : [],
  };
}

const CATALOG = aCatalog({
  species: [aSpecies({ key: "human", grantsOriginFeatChoice: true })],
  backgrounds: [aBackground({ key: "farmer", originFeat: "tough" })],
  originFeats: [aFeat("tough", "Robuste"), aFeat("musician", "Musicien", 3), aFeat("alert", "Vigilant")],
});

function renderStep(overrides: Partial<CharacterComposition>) {
  const onChange = vi.fn();
  render(
    <FeatsStepView
      catalog={CATALOG}
      composition={{
        ...EMPTY_COMPOSITION, speciesKey: "human", backgroundKey: "farmer",
        speciesFeat: "musician", featToolChoices: { musician: ["lute", "lyre", "flute"] },
        ...overrides,
      }}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("don d'Origine de l'Humain", () => {
  it("ne change rien quand on retient le don déjà retenu", async () => {
    const onChange = renderStep({});

    await userEvent.click(screen.getByRole("button", { name: "Musicien" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("emporte les outils du don quitté", async () => {
    const onChange = renderStep({});

    await userEvent.click(screen.getByRole("button", { name: "Vigilant" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ speciesFeat: "alert", featToolChoices: {} }),
    );
  });
});
