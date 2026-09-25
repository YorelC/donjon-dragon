import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aSheetModel } from "../types/character-sheet-model.fixture";
import { GearTabView } from "./gear-tab.view";
import { IdentityTabView } from "./identity-tab.view";
import { SheetIdentityPanelView } from "./sheet-identity-panel.view";
import { SheetTabsView } from "./sheet-tabs.view";

describe("SheetIdentityPanelView", () => {
  it("étoile les seules sauvegardes maîtrisées", () => {
    render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(screen.getAllByRole("img", { name: "Sauvegarde maîtrisée" })).toHaveLength(2);
  });

  it("montre toujours les 18 compétences, maîtrisées ou non", () => {
    const { container } = render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(container.querySelectorAll("li[data-proficient]")).toHaveLength(18);
    expect(container.querySelectorAll('li[data-proficient="true"]')).toHaveLength(2);
  });

  it("écrit taille et vitesse à la française", () => {
    render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(screen.getByText("1,72 m")).toBeInTheDocument();
    expect(screen.getByText("10,5 m")).toBeInTheDocument();
  });
});

describe("SheetTabsView", () => {
  it("n'ouvre pas de grimoire à un personnage sans incantation", () => {
    render(<SheetTabsView model={aSheetModel()} />);

    expect(screen.queryByRole("tab", { name: /Grimoire/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  it("ouvre le grimoire dès qu'une incantation existe", () => {
    render(<SheetTabsView model={aSheetModel({ spellcasting: [aSpellcasting()] })} />);

    expect(screen.getByRole("tab", { name: /Grimoire/ })).toBeInTheDocument();
  });
});

describe("GearTabView", () => {
  it("annonce les actions sur l'inventaire sans les ouvrir", () => {
    render(<GearTabView equipment={aSheetModel().sheet.equipment} />);

    const row = screen.getByText("Corde en chanvre").closest("li");
    within(row as HTMLElement).getAllByRole("button").forEach((button) => {
      expect(button).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: "Dépenser" })).toBeDisabled();
  });
});

describe("IdentityTabView", () => {
  it("masque l'apparence quand le joueur n'en a pas écrit", () => {
    const model = aSheetModel();
    render(<IdentityTabView model={{ ...model, identity: { ...model.identity, description: null } }} />);

    expect(screen.queryByText("Apparence")).not.toBeInTheDocument();
    expect(screen.getByText("Maîtrises et langues")).toBeInTheDocument();
  });

  it("nomme les maîtrises au lieu d'afficher leurs clés", () => {
    render(<IdentityTabView model={aSheetModel()} />);

    expect(screen.getByText("simples, de guerre")).toBeInTheDocument();
    expect(screen.getByText("légères, intermédiaires, boucliers")).toBeInTheDocument();
  });
});

function aSpellcasting() {
  return {
    origin: "Rôdeur", ability: "wisdom" as const, saveDc: 13, attackBonus: 5,
    cantripsKnown: [], level1Slots: 2, slotsRecoverOnShortRest: false,
    spellsPrepared: [{
      spellKey: "hunters-mark", name: "Marque du chasseur",
      alwaysPrepared: true, ritualOnly: false, freeCastFrequency: null,
    }],
  };
}
