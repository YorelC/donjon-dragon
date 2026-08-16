/**
 * Une divergence est un désaccord nommé entre le projet et le SRD, sur un champ
 * précis d'une entrée précise. Pas un score, pas un pourcentage : une ligne
 * qu'un humain peut trancher.
 */
export type Divergence = {
  domain: string;
  key: string;
  field: string;
  project: string;
  srd: string;
};

/** Une entrée présente d'un côté et absente de l'autre, avec un candidat quand on en devine un. */
export type Orphan = {
  domain: string;
  key: string;
  name: string;
  suggestion: string | null;
};

export type DomainReport = {
  domain: string;
  projectCount: number;
  srdCount: number;
  matchedCount: number;
  divergences: Divergence[];
  missingInSrd: Orphan[];
  missingInProject: Orphan[];
};

export function describe(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Les tableaux se comparent sans tenir compte de l'ordre : le SRD ne le garantit pas. */
export function isSameValue(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify([...value].map(describe).sort());
  return describe(value);
}
