import { randomUUID } from 'crypto';

import type { CharacterId } from './character-id';
import { JournalChapterId } from './journal-chapter-id';
import {
  JournalChapterModifiedElsewhereError,
  JournalFullError,
  JournalOrderMismatchError,
} from './journal-chapter.errors';
import type { OwningCampaignId } from './owning-campaign-id';

export interface JournalChapterSnapshot {
  id: string;
  campaignId: string;
  characterId: string;
  title: string;
  body: string;
  position: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalChapterCreation {
  campaignId: OwningCampaignId;
  characterId: CharacterId;
  title: string;
  position: number;
  now: Date;
}

export interface JournalChapterContent {
  title: string;
  body: string;
}

interface JournalChapterState extends JournalChapterContent {
  position: number;
  revision: number;
  updatedAt: string;
}

/**
 * Un chapitre du journal de bord d'un personnage (spec 013).
 *
 * Agrégat distinct du personnage : écrire une note ne change pas la révision de
 * la fiche. Les bornes de titre et de texte sont celles du contrat partagé,
 * vérifiées à l'entrée par son schéma : le domaine ne dépend d'aucun transport et
 * ne recopie pas ces valeurs.
 *
 * La position n'est pas versionnée : réordonner le journal ne doit pas mettre en
 * conflit la sauvegarde d'un chapitre ouvert ailleurs.
 */
export class JournalChapter {
  private constructor(
    readonly id: JournalChapterId,
    private readonly origin: Pick<JournalChapterSnapshot, 'campaignId' | 'characterId' | 'createdAt'>,
    private state: JournalChapterState,
  ) {}

  static create(input: JournalChapterCreation): JournalChapter {
    const createdAt = input.now.toISOString();
    return new JournalChapter(
      JournalChapterId.create(randomUUID()),
      { campaignId: input.campaignId.value, characterId: input.characterId.value, createdAt },
      { title: input.title, body: '', position: input.position, revision: INITIAL_REVISION, updatedAt: createdAt },
    );
  }

  static restore(snapshot: JournalChapterSnapshot): JournalChapter {
    const { id, campaignId, characterId, createdAt, ...state } = snapshot;
    return new JournalChapter(JournalChapterId.create(id), { campaignId, characterId, createdAt }, state);
  }

  get campaignId(): string {
    return this.origin.campaignId;
  }

  get title(): string {
    return this.state.title;
  }

  get body(): string {
    return this.state.body;
  }

  get position(): number {
    return this.state.position;
  }

  get revision(): number {
    return this.state.revision;
  }

  get updatedAt(): string {
    return this.state.updatedAt;
  }

  assertRevision(expectedRevision: number): void {
    if (this.state.revision !== expectedRevision) {
      throw new JournalChapterModifiedElsewhereError();
    }
  }

  rewrite(content: JournalChapterContent, now: Date): void {
    this.state.title = content.title;
    this.state.body = content.body;
    this.state.revision += REVISION_INCREMENT;
    this.state.updatedAt = now.toISOString();
  }

  moveTo(position: number): void {
    this.state.position = position;
  }

  snapshot(): JournalChapterSnapshot {
    return { id: this.id.value, ...this.origin, ...this.state };
  }
}

export function assertRoomForChapter(chapterCount: number, capacity: number): void {
  if (chapterCount >= capacity) throw new JournalFullError();
}

/**
 * Range les chapitres dans l'ordre reçu. L'ordre doit nommer chaque chapitre du
 * journal une fois et une seule : un chapitre créé ou supprimé ailleurs entre-temps
 * rend l'ordre caduc, plutôt que de le deviner.
 */
export function reorderChapters(
  chapters: readonly JournalChapter[],
  order: readonly JournalChapterId[],
): JournalChapter[] {
  if (!namesEachChapterOnce(chapters, order)) throw new JournalOrderMismatchError();
  return order.map((id, position) => placeChapter(chapters, id, position));
}

function namesEachChapterOnce(
  chapters: readonly JournalChapter[],
  order: readonly JournalChapterId[],
): boolean {
  const distinct = new Set(order.map((id) => id.value));
  return distinct.size === order.length
    && order.length === chapters.length
    && chapters.every((chapter) => distinct.has(chapter.id.value));
}

function placeChapter(
  chapters: readonly JournalChapter[],
  id: JournalChapterId,
  position: number,
): JournalChapter {
  const chapter = chapters.find((candidate) => candidate.id.equals(id));
  if (!chapter) throw new JournalOrderMismatchError();
  chapter.moveTo(position);
  return chapter;
}

const INITIAL_REVISION = 0;
const REVISION_INCREMENT = 1;
