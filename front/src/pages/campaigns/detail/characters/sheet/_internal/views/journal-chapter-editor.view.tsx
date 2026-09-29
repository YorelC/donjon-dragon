import { Lock, LockOpen } from "lucide-react";
import { CHARACTER_JOURNAL_RULES } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import { Markdown } from "@/shared/components/atoms/markdown";
import { Textarea } from "@/shared/components/atoms/textarea";
import { JOURNAL_LABELS, SAVE_STATUS_LABELS } from "../constants/journal-labels";
import type { ChapterAutosave } from "../hooks/use-chapter-autosave";
import type { ChapterEditor, ChapterLockToggle } from "../hooks/use-chapter-editor";
import { displayTitle } from "../utils/journal-chapters";
import { ConflictDialog, DeleteChapterButton } from "./journal-chapter-dialogs.view";

interface JournalChapterEditorViewProps {
  editor: ChapterEditor;
  canWrite: boolean;
}

/** Verrouillé, le chapitre se lit en Markdown rendu ; déverrouillé, sa source s'écrit. */
export function JournalChapterEditorView({ editor, canWrite }: JournalChapterEditorViewProps) {
  const writing = canWrite && !editor.lock.locked;

  return (
    <section className="journal-chapter" aria-label={displayTitle(editor.autosave.draft.title)}>
      <header className="flex items-center gap-3">
        <ChapterTitle autosave={editor.autosave} writing={writing} />
        {canWrite ? <WriterTools editor={editor} /> : null}
      </header>
      {writing ? <LimitNotice autosave={editor.autosave} /> : null}
      <div className="journal-chapter-body">
        {writing ? <ChapterSource autosave={editor.autosave} /> : <ChapterReading autosave={editor.autosave} />}
      </div>
      <ConflictDialog autosave={editor.autosave} />
    </section>
  );
}

function ChapterTitle({ autosave, writing }: { autosave: ChapterAutosave; writing: boolean }) {
  if (!writing) return <h3 className="journal-chapter-title">{displayTitle(autosave.draft.title)}</h3>;

  return (
    <Input
      autoFocus
      value={autosave.draft.title}
      maxLength={CHARACTER_JOURNAL_RULES.titleMax}
      placeholder={JOURNAL_LABELS.titlePlaceholder}
      aria-label={JOURNAL_LABELS.titlePlaceholder}
      title={JOURNAL_LABELS.titleLimit}
      onChange={(event) => autosave.setTitle(event.target.value)}
      className="min-w-0 flex-1"
    />
  );
}

function WriterTools({ editor }: { editor: ChapterEditor }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="meta-line" role="status">{SAVE_STATUS_LABELS[editor.autosave.status]}</span>
      <LockButton lock={editor.lock} />
      <DeleteChapterButton title={displayTitle(editor.autosave.draft.title)} onDelete={editor.remove} />
    </div>
  );
}

function LockButton({ lock }: { lock: ChapterLockToggle }) {
  const label = lock.locked ? JOURNAL_LABELS.unlock : JOURNAL_LABELS.lock;

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      aria-pressed={lock.locked}
      title={label}
      onClick={lock.toggle}
    >
      {lock.locked ? <Lock /> : <LockOpen />}
    </Button>
  );
}

function ChapterSource({ autosave }: { autosave: ChapterAutosave }) {
  return (
    <Textarea
      value={autosave.draft.body}
      maxLength={CHARACTER_JOURNAL_RULES.bodyMax}
      placeholder={JOURNAL_LABELS.bodyPlaceholder}
      aria-label={JOURNAL_LABELS.bodyPlaceholder}
      title={JOURNAL_LABELS.bodyLimit}
      onChange={(event) => autosave.setBody(event.target.value)}
      className="min-h-80 resize-none text-body/[1.8]"
    />
  );
}

function ChapterReading({ autosave }: { autosave: ChapterAutosave }) {
  if (!autosave.draft.body.trim()) return <p className="empty-state-text">{JOURNAL_LABELS.emptyChapter}</p>;
  return <Markdown source={autosave.draft.body} />;
}

/** La saisie s'arrête à la borne : l'auteur doit savoir pourquoi. */
function LimitNotice({ autosave }: { autosave: ChapterAutosave }) {
  const notices = [
    autosave.draft.title.length >= CHARACTER_JOURNAL_RULES.titleMax && JOURNAL_LABELS.titleLimit,
    autosave.draft.body.length >= CHARACTER_JOURNAL_RULES.bodyMax && JOURNAL_LABELS.bodyLimit,
  ].filter(Boolean);
  if (notices.length === 0) return null;
  return <p className="fine-print" role="alert">{notices.join(" ")}</p>;
}
