/**
 * La ligne de méta sous chaque pseudo. Le serveur ne connaît aujourd'hui que le
 * pseudo et la date des demandes : tout le reste est affiché comme manquant,
 * jamais inventé. Les champs à ouvrir côté back sont listés dans
 * `docs/friends-meta-backend-gaps.md`.
 */
export const MISSING_META = "—";

const SEPARATOR = " · ";

export function toFriendMeta(): string {
  return [
    `Classe ${MISSING_META}`,
    `Niveau ${MISSING_META}`,
    `Dernière séance ${MISSING_META}`,
  ].join(SEPARATOR);
}

export function toReceivedRequestMeta(createdAt: string): string {
  return [
    `Demande reçue ${toRelativeDate(createdAt)}`,
    `Amis en commun ${MISSING_META}`,
  ].join(SEPARATOR);
}

export function toSentRequestMeta(createdAt: string): string {
  return `Invitation envoyée ${toRelativeDate(createdAt)}`;
}

export function toSearchResultMeta(): string {
  return [`Classe ${MISSING_META}`, `Niveau ${MISSING_META}`].join(SEPARATOR);
}

/** Deux lettres, comme sur le médaillon losange de la charte. */
export function toInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) return MISSING_META;

  return trimmed.charAt(0).toUpperCase() + trimmed.charAt(1).toLowerCase();
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Du plus grossier au plus fin : la première unité qui contient l'écart gagne.
const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * DAY_MS },
  { unit: "month", ms: 30 * DAY_MS },
  { unit: "day", ms: DAY_MS },
  { unit: "hour", ms: HOUR_MS },
  { unit: "minute", ms: MINUTE_MS },
];

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export function toRelativeDate(isoDate: string): string {
  const elapsedMs = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(elapsedMs)) return MISSING_META;

  const scale = RELATIVE_UNITS.find(({ ms }) => Math.abs(elapsedMs) >= ms);
  if (!scale) return "à l'instant";

  return RELATIVE_FORMAT.format(-Math.trunc(elapsedMs / scale.ms), scale.unit);
}
