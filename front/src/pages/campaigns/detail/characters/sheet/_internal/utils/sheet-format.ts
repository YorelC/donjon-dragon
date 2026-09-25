const FRENCH_LOCALE = "fr-FR";
const CENTIMETERS_PER_METER = 100;
const METER_DIGITS = 2;

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function formatMeters(value: number): string {
  return `${value.toLocaleString(FRENCH_LOCALE)} m`;
}

/** 172 cm s'écrit « 1,72 m » sur la fiche, comme dans la maquette. */
export function formatHeight(heightCm: number): string {
  const meters = (heightCm / CENTIMETERS_PER_METER).toLocaleString(FRENCH_LOCALE, {
    minimumFractionDigits: METER_DIGITS,
    maximumFractionDigits: METER_DIGITS,
  });
  return `${meters} m`;
}

/** Un libellé manquant affiche la clé brute : mieux vaut « thievesCant » qu'un trou. */
export function toLabel<K extends string>(labels: Partial<Record<K, string>>, key: K): string {
  return labels[key] ?? key;
}

export function toLabelList<K extends string>(
  labels: Partial<Record<K, string>>,
  keys: readonly K[],
): string {
  return keys.map((key) => toLabel(labels, key)).join(", ");
}
