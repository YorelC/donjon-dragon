/** Le journal visé : celui d'un personnage de campagne. */
export interface JournalTarget {
  campaignId: string;
  characterId: string;
}

export interface ChapterTarget extends JournalTarget {
  chapterId: string;
}

export interface ChapterDraft {
  title: string;
  body: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed" | "conflict";

/** Un chapitre s'ouvre verrouillé ; celui qu'on vient de créer s'ouvre prêt à écrire. */
export type ChapterLock = "locked" | "unlocked";

/** Ce qu'il faut pour ouvrir un chapitre : lequel, dans quel état, et qui le lit. */
export interface ChapterOpening {
  target: ChapterTarget;
  initialLock: ChapterLock;
  canWrite: boolean;
}
