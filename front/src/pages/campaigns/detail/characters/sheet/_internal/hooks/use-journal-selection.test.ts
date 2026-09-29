import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useJournalSelection } from "./use-journal-selection";

describe("useJournalSelection", () => {
  it("ouvre le premier chapitre à l’arrivée", () => {
    const { result } = renderHook(() => useJournalSelection(["a", "b"]));

    expect(result.current.selectedId).toBe("a");
  });

  it("ouvre, après une suppression, le chapitre qui prend sa place, ou le précédent", () => {
    const { result, rerender } = renderHook(({ ids }) => useJournalSelection(ids), {
      initialProps: { ids: ["a", "b", "c"] },
    });

    act(() => result.current.select("b"));
    rerender({ ids: ["a", "c"] });
    expect(result.current.selectedId).toBe("c");

    rerender({ ids: ["a"] });
    expect(result.current.selectedId).toBe("a");
  });

  it("garde le chapitre ouvert quand l’ordre change, même sans l’avoir choisi", () => {
    const { result, rerender } = renderHook(({ ids }) => useJournalSelection(ids), {
      initialProps: { ids: ["a", "b", "c"] },
    });

    rerender({ ids: ["b", "c", "a"] });
    expect(result.current.selectedId).toBe("a");
  });

  it("garde aussi le chapitre ouvert par repli après une suppression", () => {
    const { result, rerender } = renderHook(({ ids }) => useJournalSelection(ids), {
      initialProps: { ids: ["a", "b", "c"] },
    });

    act(() => result.current.select("b"));
    rerender({ ids: ["a", "c"] });
    rerender({ ids: ["c", "a"] });
    expect(result.current.selectedId).toBe("c");
  });

  it("n’ouvre rien dans un journal vide", () => {
    const { result } = renderHook(() => useJournalSelection([]));

    expect(result.current.selectedId).toBeNull();
  });
});
