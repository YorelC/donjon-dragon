import { useRef, useState, type MutableRefObject } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { JournalChapter } from "@donjon-dragon/shared";
import { fetchJournalChapter, journalChapterKey } from "../queries/use-character-journal";
import {
  putJournalChapter,
  putJournalChapterOnExit,
  recordSavedChapter,
} from "../queries/use-journal-mutations";
import type { ChapterDraft, ChapterTarget, SaveStatus } from "../types/journal";
import { draftOf, failureStatusOf, sameDraft } from "../utils/journal-draft";

export interface ChapterSync {
  status: SaveStatus;
  /**
   * Enregistre le brouillon s'il diffère de la version enregistrée. Pendant une
   * sauvegarde en vol, il attend qu'elle se termine, même si l'éditeur se ferme.
   */
  flush: (draft: ChapterDraft) => void;
  /** La page se ferme : dernier envoi, maintenu par le navigateur après la fermeture. */
  flushOnExit: (draft: ChapterDraft) => void;
  takeTheirs: () => Promise<ChapterDraft>;
  keepMine: (draft: ChapterDraft) => Promise<void>;
}

/** La dernière version que le serveur a acceptée, et la révision d'où part la prochaine. */
interface ServerCopy {
  revision: number;
  draft: ChapterDraft;
}

interface SyncState {
  target: ChapterTarget;
  queryClient: QueryClient;
  server: MutableRefObject<ServerCopy>;
  // Une sauvegarde en vol ou un conflit ouvert : aucune autre ne part.
  busy: MutableRefObject<boolean>;
  // Le brouillon arrivé pendant une sauvegarde en vol, qui part dès qu'elle se termine.
  pending: MutableRefObject<ChapterDraft | null>;
  setStatus: (status: SaveStatus) => void;
}

export function useChapterSync(target: ChapterTarget, chapter: JournalChapter): ChapterSync {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const server = useRef<ServerCopy>({ revision: chapter.revision, draft: draftOf(chapter) });
  const busy = useRef(false);
  const pending = useRef<ChapterDraft | null>(null);
  const state: SyncState = { target, queryClient, server, busy, pending, setStatus };

  return {
    status,
    flush: (draft) => flushDraft(state, draft),
    flushOnExit: (draft) => flushOnExit(state, draft),
    takeTheirs: () => takeTheirs(state),
    keepMine: (draft) => keepMine(state, draft),
  };
}

function flushDraft(state: SyncState, draft: ChapterDraft): void {
  if (sameDraft(draft, state.server.current.draft)) return;
  if (state.busy.current) {
    state.pending.current = draft;
    return;
  }
  persistDraft(state, draft);
}

function persistDraft(state: SyncState, draft: ChapterDraft): void {
  settle(state, "saving");
  putJournalChapter(state.target, { ...draft, expectedRevision: state.server.current.revision })
    .then((saved) => {
      state.server.current = { revision: saved.revision, draft };
      recordSavedChapter(state.queryClient, state.target, { ...saved, ...draft });
      settle(state, "saved");
    })
    .catch((error: unknown) => settle(state, failureStatusOf(error)));
}

// En conflit, le brouillon reste à l'écran jusqu'au choix : rien n'attend plus.
function settle(state: SyncState, status: SaveStatus): void {
  state.busy.current = status === "saving" || status === "conflict";
  state.setStatus(status);
  if (status === "conflict") state.pending.current = null;
  if (!state.busy.current) sendPending(state);
}

function sendPending(state: SyncState): void {
  const next = state.pending.current;
  state.pending.current = null;
  if (next) flushDraft(state, next);
}

// Une sauvegarde en vol ferait refuser celle-ci pour révision dépassée : on ne l'envoie pas.
function flushOnExit(state: SyncState, draft: ChapterDraft): void {
  const latest = state.pending.current ?? draft;
  if (state.busy.current || sameDraft(latest, state.server.current.draft)) return;
  void putJournalChapterOnExit(state.target, {
    ...latest, expectedRevision: state.server.current.revision,
  }).catch(() => undefined);
}

async function takeTheirs(state: SyncState): Promise<ChapterDraft> {
  const latest = await rebaseOnLatest(state);
  recordSavedChapter(state.queryClient, state.target, latest);
  settle(state, "saved");
  return draftOf(latest);
}

async function keepMine(state: SyncState, draft: ChapterDraft): Promise<void> {
  await rebaseOnLatest(state);
  persistDraft(state, draft);
}

async function rebaseOnLatest(state: SyncState): Promise<JournalChapter> {
  const latest = await state.queryClient.fetchQuery({
    queryKey: journalChapterKey(state.target),
    queryFn: () => fetchJournalChapter(state.target),
    staleTime: 0,
  });
  state.server.current = { revision: latest.revision, draft: draftOf(latest) };
  return latest;
}
