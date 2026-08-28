import { MISSING_META } from "@/shared/utils/display-meta";

/**
 * Ce qu'on affiche sous un pseudo — et rien d'autre.
 *
 * Un ami est un COMPTE, pas un personnage : il n'a ni classe ni niveau, et la
 * liste d'amis comme les résultats de recherche s'en tiennent donc au pseudo
 * seul. Seules les demandes portent une méta, parce qu'elles portent une date
 * réelle. Ce qui manque encore côté serveur : `docs/friends-meta-backend-gaps.md`.
 */

export function toReceivedRequestMeta(createdAt: string): string {
  return `Demande reçue ${toRelativeDate(createdAt)}`;
}

export function toSentRequestMeta(createdAt: string): string {
  return `Invitation envoyée ${toRelativeDate(createdAt)}`;
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
