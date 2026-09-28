import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GrimoireTabContainer } from "../containers/grimoire-tab.container";
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

  it("écrit la vitesse à la française", () => {
    render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(screen.getByText("10,5 m")).toBeInTheDocument();
  });

  it("laisse langues et signalement à l'onglet Identité", () => {
    render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(screen.queryByText("Langues")).not.toBeInTheDocument();
    expect(screen.queryByText("Signalement")).not.toBeInTheDocument();
  });

  it("montre PV et dés de vie pleins tant que rien ne les dépense", () => {
    render(<SheetIdentityPanelView model={aSheetModel()} />);

    expect(screen.getByText("12 / 12")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 · d10")).toBeInTheDocument();
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

  it("range l'armure portée une seule fois, sous Armures", () => {
    render(<GearTabView equipment={aSheetModel().sheet.equipment} />);

    const armor = screen.getByText("Armure de cuir").closest("li");
    expect(screen.getAllByText("Armure de cuir")).toHaveLength(1);
    expect(armor).toHaveAttribute("data-worn", "true");
    expect(screen.getByText("Armures")).toBeInTheDocument();
    expect(screen.getByText("Matériel")).toBeInTheDocument();
    expect(screen.queryByText("Outils")).not.toBeInTheDocument();
  });
});

describe("IdentityTabView", () => {
  it("masque l'apparence quand le joueur n'en a pas écrit", () => {
    const model = aSheetModel();
    render(<IdentityTabView model={{ ...model, identity: { ...model.identity, description: null } }} />);

    expect(screen.queryByText("Apparence")).not.toBeInTheDocument();
    expect(screen.getByText("Maîtrises et langues")).toBeInTheDocument();
  });

  it("porte le signalement, écrit à la française", () => {
    render(<IdentityTabView model={aSheetModel()} />);

    expect(screen.getByText("Signalement")).toBeInTheDocument();
    expect(screen.getByText("1,72 m")).toBeInTheDocument();
  });

  it("nomme les maîtrises au lieu d'afficher leurs clés", () => {
    render(<IdentityTabView model={aSheetModel()} />);

    expect(screen.getByText("simples, de guerre")).toBeInTheDocument();
    expect(screen.getByText("légères, intermédiaires, boucliers")).toBeInTheDocument();
  });
});

describe("GrimoireTabContainer", () => {
  const renderGrimoire = () =>
    render(<GrimoireTabContainer sheet={aSheetModel({ spellcasting: [aSpellcasting()] }).sheet} />);

  it("porte caractéristique, DD et attaque dans l'en-tête de sa source", () => {
    renderGrimoire();

    expect(screen.getByText("Rôdeur")).toBeInTheDocument();
    expect(screen.getByText("Sagesse")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("montre la fiche complète du sort survolé", () => {
    renderGrimoire();

    fireEvent.mouseEnter(screen.getByRole("button", { name: /Marque du chasseur/ }));

    expect(screen.getByText("Sort de niveau 1 · Divination")).toBeInTheDocument();
    expect(screen.getByText("Concentration, jusqu'à 1 heure")).toBeInTheDocument();
    expect(screen.getByText("V")).toBeInTheDocument();
  });

  it("garde le sort cliqué quand le survol cesse, et revient à lui après un autre", () => {
    renderGrimoire();
    const mark = screen.getByRole("button", { name: /Marque du chasseur/ });
    const guidance = screen.getByRole("button", { name: /Assistance/ });

    fireEvent.click(mark);
    fireEvent.mouseLeave(mark);
    fireEvent.mouseEnter(guidance);
    expect(screen.getByText("Sort mineur · Divination")).toBeInTheDocument();

    fireEvent.mouseLeave(guidance);
    expect(screen.getByText("Sort de niveau 1 · Divination")).toBeInTheDocument();
    expect(mark).toHaveAttribute("aria-pressed", "true");
  });
});

function aSpellcasting() {
  return {
    origin: "Rôdeur", ability: "wisdom" as const, saveDc: 13, attackBonus: 5,
    level1Slots: 2, slotsRecoverOnShortRest: false,
    cantripsKnown: [{
      spellKey: "guidance", name: "Assistance", detail: aSpellDetail({ level: 0 }),
      alwaysPrepared: false, ritualOnly: false, freeCastFrequency: null,
    }],
    spellsPrepared: [{
      spellKey: "hunters-mark", name: "Marque du chasseur", detail: aSpellDetail({ level: 1 }),
      alwaysPrepared: true, ritualOnly: false, freeCastFrequency: null,
    }],
  };
}

function aSpellDetail({ level }: { level: number }) {
  return {
    level, school: "divination", castingTime: "Action bonus", range: "27 m",
    components: { verbal: true, somatic: false, material: null },
    duration: "jusqu'à 1 heure", concentration: true, ritual: false,
    description: "Vous désignez magiquement une créature comme votre proie.",
  };
}
