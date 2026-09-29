import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MAX_MARKDOWN_DEPTH } from "@/shared/utils/markdown-nesting";
import { Markdown } from "./markdown";

// Chaque cas faisait déborder la pile avant la borne d'imbrication (spec 013).
const HOSTILE_SOURCES = {
  "listes en ligne": "- ".repeat(9_999) + "x",
  citations: ">".repeat(19_999) + "x",
  "listes et citations mêlées": "> - ".repeat(4_999) + "x",
  "listes numérotées": "1. ".repeat(6_666),
  "listes à parenthèse": "1) ".repeat(6_666) + "x",
  "puces mêlées": "+ - * ".repeat(3_333) + "x",
};

describe("Markdown", () => {
  it.each(Object.entries(HOSTILE_SOURCES))(
    "affiche 20 000 caractères de %s sans faire tomber la page",
    (_name, source) => {
      const { container } = render(<Markdown source={source} />);

      expect(container.querySelector("[data-slot=markdown]")).not.toBeNull();
      expect(container.querySelector("pre")).not.toBeNull();
    },
  );

  it("garde la mise en forme tant que l’imbrication reste sous la borne", () => {
    const shallow = Array.from({ length: MAX_MARKDOWN_DEPTH / 4 }, (_, level) => `${"  ".repeat(level)}- niveau ${level}`)
      .join("\n");
    const { container } = render(<Markdown source={shallow} />);

    expect(container.querySelector("pre")).toBeNull();
    expect(screen.getByText("niveau 5")).toBeInTheDocument();
  });

  it("ouvre un lien dans un nouvel onglet sans transmettre l’adresse de la fiche", () => {
    render(<Markdown source="[carte](https://exemple.test/carte)" />);

    const link = screen.getByRole("link", { name: "carte" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("montre la source quand le rendu échoue, jamais une page blanche", async () => {
    vi.resetModules();
    vi.doMock("react-markdown", () => ({
      default: () => {
        throw new Error("rendu impossible");
      },
    }));
    const { Markdown: FailingMarkdown } = await import("./markdown");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<FailingMarkdown source="# Le forgeron ment" />);

    expect(screen.getByText("# Le forgeron ment").tagName).toBe("PRE");
    vi.doUnmock("react-markdown");
  });
});
