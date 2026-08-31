import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { aCatalog, aClass } from "../types/catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "../types/character-composition";
import { ClassStepView } from "./class-step.view";

const CLERIC = aClass({ key: "cleric", name: "Clerc" });
const DRUID = aClass({ key: "druid", name: "Druide" });

function renderStep(composition: Partial<CharacterComposition>) {
  const onChange = vi.fn();
  render(
    <ClassStepView
      catalog={aCatalog({ classes: [CLERIC, DRUID] })}
      composition={{ ...EMPTY_COMPOSITION, ...composition }}
      onChange={onChange}
    />,
  );

  return onChange;
}

/**
 * Le choix de classe efface sept champs — compétences, expertise, sorts mineurs,
 * sorts, style de combat, ordre. C'est correct pour un vrai changement, et
 * dévastateur sur un simple re-clic : un joueur qui reclique « Clerc » perdait
 * ses trois sorts mineurs et ses quatre sorts préparés.
 */
describe("choix de la classe", () => {
  const CONFIGURED: Partial<CharacterComposition> = {
    classKey: "cleric",
    classSkills: ["history", "insight"],
    classCantrips: ["light", "mending", "guidance"],
    classSpells: ["bane", "bless", "command", "create-or-destroy-water"],
    classOrder: "protector",
  };

  it("ne mute rien quand on reclique sur la classe courante", async () => {
    const onChange = renderStep({ ...CONFIGURED });

    await userEvent.click(screen.getByRole("radio", { name: "Clerc" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("efface bien les choix de classe quand elle change vraiment", async () => {
    const onChange = renderStep({ ...CONFIGURED });

    await userEvent.click(screen.getByRole("radio", { name: "Druide" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        classKey: "druid",
        classSkills: [],
        classCantrips: [],
        classSpells: [],
        classOrder: null,
      }),
    );
  });
});
