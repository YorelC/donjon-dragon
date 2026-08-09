/**
 * Reconnaissance d'un UUID, partagée par les identifiants typés.
 *
 * Volontairement une fonction et non une classe de base : deux value objects
 * qui hériteraient du même parent seraient structurellement identiques, donc
 * interchangeables aux yeux de TypeScript — ce qui détruirait le seul bénéfice
 * qu'on cherche ici.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(raw: string): boolean {
  return UUID_PATTERN.test(raw);
}
