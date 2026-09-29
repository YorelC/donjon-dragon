import { z } from 'zod';

/** Spec 013 : les bornes du journal d'un personnage. */
export const CHARACTER_JOURNAL_RULES = {
  maxChapters: 200,
  titleMax: 80,
  bodyMax: 20_000,
} as const;

export const JournalChapterIdSchema = z.string().uuid();
export const JournalChapterRevisionSchema = z.number().int().nonnegative();

const chapterTitleField = z.string().trim().max(CHARACTER_JOURNAL_RULES.titleMax);
// Le Markdown tient aux espaces de tête et de fin (indentation, saut forcé) : pas de trim.
const chapterBodyField = z.string().max(CHARACTER_JOURNAL_RULES.bodyMax);

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

export const CreateJournalChapterSchema = z.object({
  title: chapterTitleField,
}).strict();

export const UpdateJournalChapterSchema = z.object({
  title: chapterTitleField,
  body: chapterBodyField,
  expectedRevision: JournalChapterRevisionSchema,
}).strict();

/** L'ordre complet, du premier au dernier chapitre. */
export const ReorderJournalChaptersSchema = z.object({
  chapterIds: z.array(JournalChapterIdSchema).max(CHARACTER_JOURNAL_RULES.maxChapters),
}).strict();

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

export const JournalChapterSummarySchema = z.object({
  id: JournalChapterIdSchema,
  title: z.string(),
  revision: JournalChapterRevisionSchema,
  updatedAt: z.string().datetime(),
});

export const JournalChapterSchema = JournalChapterSummarySchema.extend({
  body: z.string(),
});

/**
 * Les chapitres dans l'ordre choisi. `canWrite` est décidé par le serveur :
 * l'interface ne re-dérive pas les droits.
 */
export const CharacterJournalSchema = z.object({
  chapters: z.array(JournalChapterSummarySchema),
  canWrite: z.boolean(),
});

/**
 * Le résultat d'une commande est conservé dans son reçu d'idempotence : il ne porte
 * ni titre ni texte, qui restent des notes personnelles.
 */
export const JournalChapterCommandResultSchema = z.object({
  id: JournalChapterIdSchema,
  revision: JournalChapterRevisionSchema,
  updatedAt: z.string().datetime(),
});

export const JournalChapterDeletionResultSchema = z.object({
  id: JournalChapterIdSchema,
});

export const JournalReorderResultSchema = z.object({
  chapterIds: z.array(JournalChapterIdSchema),
});

export type CreateJournalChapterDto = z.infer<typeof CreateJournalChapterSchema>;
export type UpdateJournalChapterDto = z.infer<typeof UpdateJournalChapterSchema>;
export type ReorderJournalChaptersDto = z.infer<typeof ReorderJournalChaptersSchema>;
export type JournalChapterSummary = z.infer<typeof JournalChapterSummarySchema>;
export type JournalChapter = z.infer<typeof JournalChapterSchema>;
export type CharacterJournal = z.infer<typeof CharacterJournalSchema>;
export type JournalChapterCommandResult = z.infer<typeof JournalChapterCommandResultSchema>;
export type JournalChapterDeletionResult = z.infer<typeof JournalChapterDeletionResultSchema>;
export type JournalReorderResult = z.infer<typeof JournalReorderResultSchema>;
