/**
 * Au-delà de cette profondeur, un texte Markdown s'affiche brut (spec 013). Le rendu
 * vers le HTML puis vers React est récursif : quelques milliers de niveaux de listes
 * ou de citations — 1 000 caractères suffisent — font déborder la pile du navigateur.
 */
export const MAX_MARKDOWN_DEPTH = 24;

// Un marqueur de conteneur en tête de ligne : citation, puce, ou numéro de liste.
const CONTAINER_MARKER = /[ \t]{0,3}(?:>|[-+*](?=[ \t]|$)|\d{1,9}[.)](?=[ \t]|$))[ \t]?/y;
const ESCAPE = "\\";
const LINE_BREAK = "\n";

/**
 * Avant l'analyse : une ligne qui empile plus de `MAX_MARKDOWN_DEPTH` marqueurs
 * (`- - - x`, `1) 1) x`, `> - > - x`) voit le suivant échappé, et sa fin devient du
 * texte. L'analyseur traite ces empilements en temps quadratique — 20 000
 * caractères gèlent la page une dizaine de secondes — avant même d'en construire
 * l'arbre ; la borne sur l'arbre arrive trop tard pour eux.
 */
export function escapeDeepMarkers(source: string): string {
  return source.split(LINE_BREAK).map(escapeLineBeyondLimit).join(LINE_BREAK);
}

function escapeLineBeyondLimit(line: string): string {
  const cut = indexAfterMarkers(line, MAX_MARKDOWN_DEPTH);
  const next = cut === null ? null : markerAt(line, cut);
  if (cut === null || next === null) return line;
  const punctuation = cut + next.search(/[>\-+*.)]/);
  return line.slice(0, punctuation) + ESCAPE + line.slice(punctuation);
}

/** La position juste après les `count` premiers marqueurs, ou `null` s'il y en a moins. */
function indexAfterMarkers(line: string, count: number): number | null {
  let index = 0;
  let found = 0;
  let marker = markerAt(line, index);
  while (marker !== null && found < count) {
    index += marker.length;
    found += 1;
    marker = found < count ? markerAt(line, index) : null;
  }
  return found === count ? index : null;
}

function markerAt(line: string, index: number): string | null {
  CONTAINER_MARKER.lastIndex = index;
  const match = CONTAINER_MARKER.exec(line);
  return match && match[0].length > 0 ? match[0] : null;
}

interface SourcePoint {
  offset?: number;
}

/** Le peu qu'on lit d'un nœud de l'arbre Markdown (mdast), sans en dépendre. */
interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  position?: { start: SourcePoint; end: SourcePoint };
}

interface NestedNode {
  node: MarkdownNode;
  depth: number;
}

// Les conteneurs qui acceptent un bloc de code comme enfant, sans HTML invalide.
const FLOW_CONTAINERS: ReadonlySet<string> = new Set(["blockquote", "listItem", "footnoteDefinition"]);
const ROOT_DEPTH = 0;
const NEXT_LEVEL = 1;

/**
 * Plugin remark : sous `MAX_MARKDOWN_DEPTH`, rien ne change ; au-delà, le contenu du
 * conteneur devient un bloc de code qui porte sa source. Le parcours n'est pas
 * récursif, pour ne pas déborder lui-même.
 */
export function limitMarkdownNesting() {
  return (tree: MarkdownNode, file: { value: unknown }) => flattenBeyondLimit(tree, String(file.value));
}

function flattenBeyondLimit(root: MarkdownNode, source: string): void {
  const pending: NestedNode[] = [{ node: root, depth: ROOT_DEPTH }];
  let current = pending.pop();
  while (current) {
    visit(current, source, pending);
    current = pending.pop();
  }
}

function visit({ node, depth }: NestedNode, source: string, pending: NestedNode[]): void {
  if (!node.children) return;
  if (depth >= MAX_MARKDOWN_DEPTH && FLOW_CONTAINERS.has(node.type)) {
    node.children = [rawBlock(node.children, source)];
    return;
  }
  node.children.forEach((child) => pending.push({ node: child, depth: depth + NEXT_LEVEL }));
}

function rawBlock(children: MarkdownNode[], source: string): MarkdownNode & { value: string } {
  const start = children[0]?.position?.start.offset;
  const end = children.at(-1)?.position?.end.offset;
  return { type: "code", value: start === undefined ? "" : source.slice(start, end) };
}
