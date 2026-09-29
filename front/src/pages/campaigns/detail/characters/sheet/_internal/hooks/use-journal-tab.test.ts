import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalChapterSummary } from "@donjon-dragon/shared";

const journal = { chapters: [] as JournalChapterSummary[], canWrite: true };
const createMutation = { mutate: vi.fn(), isPending: false };

vi.mock("../queries/use-character-journal", () => ({
  useCharacterJournal: () => ({ data: journal, isLoading: false, isError: false }),
}));
vi.mock("../queries/use-journal-mutations", () => ({
  useCreateJournalChapter: () => createMutation,
  useReorderJournalChapters: () => ({ mutate: vi.fn() }),
}));

import { useJournalTab } from "./use-journal-tab";

const TARGET = { campaignId: "c", characterId: "p" };

function aSummary(id: string): JournalChapterSummary {
  return { id, title: id, revision: 0, updatedAt: "2026-09-29T10:00:00.000Z" };
}

describe("useJournalTab", () => {
  beforeEach(() => {
    journal.chapters = [aSummary("ancien")];
    createMutation.mutate.mockReset();
  });

  it("ouvre déverrouillé le chapitre créé, puis verrouillé une fois quitté", () => {
    createMutation.mutate.mockImplementation((_title, options) => {
      journal.chapters = [aSummary("ancien"), aSummary("neuf")];
      options.onSuccess({ id: "neuf" });
    });
    const { result } = renderHook(() => useJournalTab(TARGET));

    act(() => result.current.create());
    expect(result.current.selection.selectedId).toBe("neuf");
    expect(result.current.lockOf("neuf")).toBe("unlocked");

    act(() => result.current.selection.select("ancien"));
    act(() => result.current.selection.select("neuf"));
    expect(result.current.lockOf("neuf")).toBe("locked");
  });
});
