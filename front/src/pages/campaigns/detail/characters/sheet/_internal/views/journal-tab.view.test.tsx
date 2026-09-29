import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CHARACTER_JOURNAL_RULES, type JournalChapterSummary } from "@donjon-dragon/shared";
import type { ChapterAutosave } from "../hooks/use-chapter-autosave";
import type { ChapterEditor } from "../hooks/use-chapter-editor";
import type { JournalTab } from "../hooks/use-journal-tab";
import { JournalChapterEditorView } from "./journal-chapter-editor.view";
import { JournalChapterListView } from "./journal-chapter-list.view";

const TAVERN: JournalChapterSummary = {
  id: "880e8400-e29b-41d4-a716-446655440003", title: "La taverne", revision: 0,
  updatedAt: "2026-09-29T10:00:00.000Z",
};
const UNTITLED: JournalChapterSummary = { ...TAVERN, id: "990e8400-e29b-41d4-a716-446655440004", title: "" };

function aJournal(overrides: Partial<JournalTab> = {}): JournalTab {
  return {
    target: { campaignId: "c", characterId: "p" },
    chapters: [TAVERN, UNTITLED], canWrite: true, loading: false, error: false,
    selection: { selectedId: TAVERN.id, select: vi.fn() },
    lockOf: () => "locked", create: vi.fn(), creating: false, full: false, reorder: vi.fn(),
    ...overrides,
  };
}

function anEditor(body: string, locked = true): ChapterEditor {
  const autosave: ChapterAutosave = {
    draft: { title: "La taverne", body }, status: "saved",
    setTitle: vi.fn(), setBody: vi.fn(), flush: vi.fn(), takeTheirs: vi.fn(), keepMine: vi.fn(),
  };
  return { autosave, lock: { locked, toggle: vi.fn() }, remove: vi.fn() };
}

describe("JournalChapterListView", () => {
  it("donne à l’auteur de quoi créer et déplacer ses chapitres", () => {
    render(<JournalChapterListView journal={aJournal()} />);

    expect(screen.getByRole("button", { name: "Nouveau chapitre" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Déplacer La taverne" })).toBeInTheDocument();
  });

  it("n’offre plus de chapitre à un journal plein, et dit pourquoi", () => {
    render(<JournalChapterListView journal={aJournal({ full: true })} />);

    const create = screen.getByRole("button", { name: "Nouveau chapitre" });
    expect(create).toBeDisabled();
    expect(create).toHaveAttribute("title", `Un journal tient au plus ${CHARACTER_JOURNAL_RULES.maxChapters} chapitres.`);
  });

  it("guide le lecteur d’écran en français pour déplacer un chapitre", () => {
    render(<JournalChapterListView journal={aJournal()} />);

    expect(screen.getByText(/Pour déplacer cet élément, appuyez sur Espace/)).toBeInTheDocument();
    expect(screen.queryByText(/To pick up a draggable item/)).not.toBeInTheDocument();
  });

  it("ne laisse à un lecteur que le choix du chapitre", () => {
    render(<JournalChapterListView journal={aJournal({ canWrite: false })} />);

    expect(screen.queryByRole("button", { name: "Nouveau chapitre" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Déplacer/ })).not.toBeInTheDocument();
  });

  it("nomme « Sans titre » un chapitre sans titre et ouvre celui qu’on choisit", () => {
    const journal = aJournal();
    render(<JournalChapterListView journal={journal} />);

    fireEvent.click(screen.getByRole("button", { name: "Sans titre" }));

    expect(journal.selection.select).toHaveBeenCalledWith(UNTITLED.id);
    expect(screen.getByRole("button", { name: "La taverne" })).toHaveAttribute("aria-current", "true");
  });

  it("dit que le journal est vide, sans inviter un lecteur à écrire", () => {
    render(<JournalChapterListView journal={aJournal({ chapters: [], canWrite: false })} />);

    expect(screen.getByText("Ce journal est vide.")).toBeInTheDocument();
  });
});

describe("JournalChapterEditorView", () => {
  it("rend le Markdown GFM d’un chapitre verrouillé", () => {
    render(<JournalChapterEditorView editor={anEditor("- [x] indice\n\n~~clef~~ **carte**")} canWrite />);

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText("clef").tagName).toBe("DEL");
    expect(screen.getByText("carte").tagName).toBe("STRONG");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("montre une balise HTML comme du texte, sans l’interpréter", () => {
    const { container } = render(
      <JournalChapterEditorView editor={anEditor("<b>gras</b> <img src=x onerror=alert(1)>")} canWrite />,
    );

    expect(container.querySelector("b, img")).toBeNull();
    expect(screen.getByText(/<b>gras<\/b>/)).toBeInTheDocument();
  });

  it("rend une image en lien, sans jamais la charger", () => {
    const { container } = render(
      <JournalChapterEditorView editor={anEditor("![carte du Poney](https://exemple.test/carte.png)")} canWrite />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: "carte du Poney" }))
      .toHaveAttribute("href", "https://exemple.test/carte.png");
  });

  it("ouvre la source à l’écriture une fois déverrouillé", () => {
    const editor = anEditor("source", false);
    render(<JournalChapterEditorView editor={editor} canWrite />);

    fireEvent.change(screen.getByRole("textbox", { name: /Écrivez en Markdown/ }), {
      target: { value: "nouvelle source" },
    });

    expect(editor.autosave.setBody).toHaveBeenCalledWith("nouvelle source");
    expect(screen.getByRole("button", { name: "Verrouiller" })).toBeInTheDocument();
  });

  it("dit pourquoi la saisie s’arrête à la borne du texte", () => {
    render(<JournalChapterEditorView editor={anEditor("a".repeat(CHARACTER_JOURNAL_RULES.bodyMax), false)} canWrite />);

    expect(screen.getByRole("alert")).toHaveTextContent(`${CHARACTER_JOURNAL_RULES.bodyMax} caractères`);
  });

  it("ne donne à un lecteur ni verrou ni suppression", () => {
    render(<JournalChapterEditorView editor={anEditor("texte", false)} canWrite={false} />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /errouiller/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
  });
});
