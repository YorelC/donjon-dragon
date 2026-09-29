import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOMAIN_ERROR_CODE, type JournalChapter } from "@donjon-dragon/shared";

vi.mock("@/shared/api/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/api")>()),
  api: { get: vi.fn(), put: vi.fn(), putOnExit: vi.fn() },
}));

import { api, ApiError } from "@/shared/api/api";
import { AUTOSAVE_DELAY_MS } from "../constants/journal-labels";
import { useChapterAutosave } from "./use-chapter-autosave";

const TARGET = {
  campaignId: "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8",
  characterId: "660e8400-e29b-41d4-a716-446655440001",
  chapterId: "880e8400-e29b-41d4-a716-446655440003",
};
const CHAPTER_URL = `/api/campaigns/${TARGET.campaignId}/characters/${TARGET.characterId}/journal/chapters/${TARGET.chapterId}`;
const UPDATED_AT = "2026-09-29T10:00:00.000Z";

function aChapter(overrides: Partial<JournalChapter> = {}): JournalChapter {
  return { id: TARGET.chapterId, title: "La taverne", body: "", revision: 0, updatedAt: UPDATED_AT, ...overrides };
}

function savedAt(revision: number) {
  return { id: TARGET.chapterId, revision, updatedAt: UPDATED_AT };
}

describe("useChapterAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("n’enregistre qu’après une pause de frappe, depuis la révision chargée", async () => {
    vi.mocked(api.put).mockResolvedValue(savedAt(1));
    const { result } = renderAutosave();

    act(() => result.current.setBody("Le forgeron ment"));
    await pause(AUTOSAVE_DELAY_MS - 1);
    expect(api.put).not.toHaveBeenCalled();
    await pause(1);

    expect(api.put).toHaveBeenCalledWith(
      CHAPTER_URL, { title: "La taverne", body: "Le forgeron ment", expectedRevision: 0 }, expect.any(Object),
    );
    expect(result.current.status).toBe("saved");
  });

  it("n’envoie rien tant que le brouillon ne diffère pas de la version enregistrée", async () => {
    renderAutosave();

    await pause(AUTOSAVE_DELAY_MS * 2);

    expect(api.put).not.toHaveBeenCalled();
  });

  it("repart de la révision acceptée pour la sauvegarde suivante", async () => {
    vi.mocked(api.put).mockResolvedValueOnce(savedAt(1)).mockResolvedValueOnce(savedAt(2));
    const { result } = renderAutosave();

    act(() => result.current.setBody("un"));
    await pause(AUTOSAVE_DELAY_MS);
    act(() => result.current.setBody("deux"));
    await pause(AUTOSAVE_DELAY_MS);

    expect(vi.mocked(api.put).mock.calls[1]?.[1]).toMatchObject({ body: "deux", expectedRevision: 1 });
  });

  it("enregistre aussitôt à la demande, par exemple au verrouillage", async () => {
    vi.mocked(api.put).mockResolvedValue(savedAt(1));
    const { result } = renderAutosave();

    act(() => result.current.setTitle("Le forgeron"));
    await act(async () => result.current.flush());

    expect(api.put).toHaveBeenCalledTimes(1);
  });

  it("enregistre ce qui reste quand le chapitre se ferme", async () => {
    vi.mocked(api.put).mockResolvedValue(savedAt(1));
    const { result, unmount } = renderAutosave();

    act(() => result.current.setBody("dernier mot"));
    unmount();

    expect(api.put).toHaveBeenCalledTimes(1);
  });

  it("enregistre la fin tapée pendant une sauvegarde en vol, même après fermeture", async () => {
    let finishFirstSave: (saved: ReturnType<typeof savedAt>) => void = () => undefined;
    vi.mocked(api.put)
      .mockReturnValueOnce(new Promise((resolve) => { finishFirstSave = resolve; }))
      .mockResolvedValueOnce(savedAt(2));
    const { result, unmount } = renderAutosave();

    act(() => result.current.setBody("un"));
    await pause(AUTOSAVE_DELAY_MS);
    act(() => result.current.setBody("un deux"));
    unmount();
    await act(async () => finishFirstSave(savedAt(1)));

    expect(api.put).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.put).mock.calls[1]?.[1]).toMatchObject({ body: "un deux", expectedRevision: 1 });
  });

  it("envoie le brouillon en attente quand la page se ferme", async () => {
    vi.mocked(api.putOnExit).mockResolvedValue(savedAt(1));
    const { result } = renderAutosave();

    act(() => result.current.setBody("dernier mot"));
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(api.putOnExit).toHaveBeenCalledWith(
      CHAPTER_URL, { title: "La taverne", body: "dernier mot", expectedRevision: 0 }, expect.any(Object),
    );
  });

  it("repart de la révision acceptée à la fermeture si la page revient du cache", async () => {
    vi.mocked(api.putOnExit).mockResolvedValue(savedAt(1));
    vi.mocked(api.put).mockResolvedValue(savedAt(2));
    const { result } = renderAutosave();

    act(() => result.current.setBody("avant"));
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
    });
    act(() => result.current.setBody("après le retour"));
    await pause(AUTOSAVE_DELAY_MS);

    expect(api.putOnExit).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.put).mock.calls[0]?.[1]).toMatchObject({ expectedRevision: 1 });
    expect(result.current.status).toBe("saved");
  });

  describe("conflit entre deux écrans", () => {
    beforeEach(() => {
      vi.mocked(api.put).mockRejectedValueOnce(modifiedElsewhere());
      vi.mocked(api.get).mockResolvedValue(aChapter({ body: "version du téléphone", revision: 5 }));
    });

    it("suspend la sauvegarde automatique jusqu’au choix de l’auteur", async () => {
      const { result } = renderAutosave();

      act(() => result.current.setBody("version de l’ordinateur"));
      await pause(AUTOSAVE_DELAY_MS);
      act(() => result.current.setBody("encore"));
      await pause(AUTOSAVE_DELAY_MS * 2);

      expect(result.current.status).toBe("conflict");
      expect(api.put).toHaveBeenCalledTimes(1);
    });

    it("« prendre l’autre version » remplace le brouillon sans rien réécrire", async () => {
      const { result } = renderAutosave();
      act(() => result.current.setBody("version de l’ordinateur"));
      await pause(AUTOSAVE_DELAY_MS);

      await act(async () => result.current.takeTheirs());
      await pause(AUTOSAVE_DELAY_MS);

      expect(result.current.draft.body).toBe("version du téléphone");
      expect(result.current.status).toBe("saved");
      expect(api.put).toHaveBeenCalledTimes(1);
    });

    it("« garder ma version » l’enregistre par-dessus la version la plus récente", async () => {
      vi.mocked(api.put).mockResolvedValueOnce(savedAt(6));
      const { result } = renderAutosave();
      act(() => result.current.setBody("version de l’ordinateur"));
      await pause(AUTOSAVE_DELAY_MS);

      await act(async () => result.current.keepMine());
      await pause(0);

      expect(vi.mocked(api.put).mock.calls[1]?.[1])
        .toMatchObject({ body: "version de l’ordinateur", expectedRevision: 5 });
      expect(result.current.status).toBe("saved");
    });
  });

  it("dit l’échec d’une sauvegarde refusée pour une autre raison", async () => {
    vi.mocked(api.put).mockRejectedValueOnce(new ApiError(500, "boom"));
    const { result } = renderAutosave();

    act(() => result.current.setBody("texte"));
    await pause(AUTOSAVE_DELAY_MS);

    expect(result.current.status).toBe("failed");
  });
});

function renderAutosave() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useChapterAutosave(TARGET, aChapter()), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

async function pause(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function modifiedElsewhere() {
  return new ApiError(409, "modified", DOMAIN_ERROR_CODE["journal-chapter-modified-elsewhere"]);
}
