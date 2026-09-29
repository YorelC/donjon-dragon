import { JournalChapterContainer } from "../containers/journal-chapter.container";
import { JOURNAL_LABELS } from "../constants/journal-labels";
import type { JournalTab } from "../hooks/use-journal-tab";
import { JournalChapterListView } from "./journal-chapter-list.view";

/** Le journal de bord : le sommaire à gauche, le chapitre ouvert à droite (spec 013). */
export function JournalTabView({ journal }: { journal: JournalTab }) {
  if (journal.loading) return <p className="empty-state-text">{JOURNAL_LABELS.loading}</p>;
  if (journal.error) return <p className="empty-state-text">{JOURNAL_LABELS.loadFailed}</p>;

  return (
    <div className="journal-split">
      <JournalChapterListView journal={journal} />
      <OpenChapter journal={journal} />
    </div>
  );
}

// La clé remonte l'éditeur à chaque chapitre : son brouillon naît de ce chapitre-là.
function OpenChapter({ journal }: { journal: JournalTab }) {
  const { selectedId } = journal.selection;
  if (!selectedId) return null;

  return (
    <JournalChapterContainer
      key={selectedId}
      opening={{
        target: { ...journal.target, chapterId: selectedId },
        initialLock: journal.lockOf(selectedId),
        canWrite: journal.canWrite,
      }}
    />
  );
}
