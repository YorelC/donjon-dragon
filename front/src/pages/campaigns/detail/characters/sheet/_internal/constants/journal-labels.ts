import { CHARACTER_JOURNAL_RULES } from "@donjon-dragon/shared";
import type { SaveStatus } from "../types/journal";

export const JOURNAL_LABELS = {
  chapters: "Chapitres",
  newChapter: "Nouveau chapitre",
  untitled: "Sans titre",
  lock: "Verrouiller",
  unlock: "Déverrouiller",
  move: "Déplacer",
  titlePlaceholder: "Titre du chapitre",
  bodyPlaceholder: "Écrivez en Markdown : # titre, - liste, - [ ] case à cocher…",
  emptyForWriter: "Aucun chapitre. Commencez le journal de bord de ce personnage.",
  emptyForReader: "Ce journal est vide.",
  emptyChapter: "Chapitre vide.",
  loading: "Chargement…",
  loadFailed: "Impossible de charger le journal.",
  deleteDescription: "La suppression est définitive.",
  conflictTitle: "Ce chapitre a été modifié ailleurs.",
  conflictDescription:
    "Une autre version a été enregistrée depuis un autre écran. Laquelle garder ?",
  takeTheirs: "Prendre l'autre version",
  keepMine: "Garder ma version",
  createFailed: "Impossible de créer le chapitre",
  deleted: "Chapitre supprimé",
  deleteFailed: "Impossible de supprimer le chapitre",
  reorderFailed: "Impossible de réordonner le journal",
  titleLimit: `Titre limité à ${CHARACTER_JOURNAL_RULES.titleMax} caractères.`,
  bodyLimit: `Texte limité à ${CHARACTER_JOURNAL_RULES.bodyMax} caractères.`,
  journalFull: `Un journal tient au plus ${CHARACTER_JOURNAL_RULES.maxChapters} chapitres.`,
} as const;

export const deleteChapterTitle = (title: string) => `Supprimer « ${title} » ?`;

/** Ce que l'en-tête du chapitre dit de sa sauvegarde ; rien tant qu'on n'a rien écrit. */
export const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  saving: "Enregistrement…",
  saved: "Enregistré",
  failed: "Échec de l'enregistrement",
  conflict: "Modifié ailleurs",
};
