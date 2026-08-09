import type { Clock } from '@kernel/application/clock.port';

/**
 * Horloge de test : elle ne bouge que si on la bouge.
 *
 * C'est tout l'intérêt de l'injection — pouvoir se placer juste avant et juste
 * après une limite (expiration d'un token, sortie de la fenêtre de grâce) au lieu
 * d'attendre vraiment ou de tolérer une marge.
 */
/**
 * Instant de reference des tests. Une date FIXE et non `new Date()` : deux
 * executions doivent produire exactement les memes snapshots.
 */
export const TEST_INSTANT = new Date('2026-01-01T12:00:00.000Z');

export class FixedClock implements Clock {
  constructor(private current: Date = TEST_INSTANT) {}

  now(): Date {
    return new Date(this.current);
  }

  /** Avance le temps, pour franchir une limite au milieu d'un test. */
  advanceBy(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  set(instant: Date): void {
    this.current = new Date(instant);
  }
}
