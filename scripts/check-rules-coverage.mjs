#!/usr/bin/env node
/**
 * Fitness function du budget d'instructions.
 *
 * Les rules de `.claude/rules/` se chargent sur correspondance de chemin. Deux
 * derives sont possibles, et aucune ne se voit a la lecture d'un diff :
 *
 *   - un fichier de production cesse d'etre couvert parce qu'il sort de la
 *     convention de nommage sur laquelle son glob est accroche ;
 *   - un glob est relache et se remet a matcher trop large, ce qui rempile
 *     plusieurs fichiers d'instructions sur chaque fichier ouvert.
 *
 * Ce controle echoue sur les deux. Il ne remplace pas dependency-cruiser : il
 * garde le cout du contexte, pas les frontieres du code.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Au-dela, un fichier ouvert empile trop d'instructions pour le service rendu. */
const MAX_RULES_PER_FILE = 3;

/** Le front n'a de rules que sur page/container/view : le reste n'a rien a dire. */
const COVERAGE_REQUIRED_IN = 'back/src';

main();

function main() {
  const rules = loadPathScopedRules();
  const matches = new Map(
    sourceFiles(join(ROOT, 'back/src'))
      .concat(sourceFiles(join(ROOT, 'front/src')))
      .map((file) => [file, rules.filter((r) => r.matches(file)).map((r) => r.name)]),
  );

  const failures = [...uncovered(matches), ...overloaded(matches)];
  report(matches, failures);

  process.exit(failures.length === 0 ? 0 : 1);
}

function uncovered(matches) {
  return [...matches]
    .filter(([file, names]) => names.length === 0 && file.startsWith(COVERAGE_REQUIRED_IN))
    .map(([file]) => `${file} n'est couvert par aucune rule`);
}

function overloaded(matches) {
  return [...matches]
    .filter(([, names]) => names.length > MAX_RULES_PER_FILE)
    .map(([file, names]) => `${file} charge ${names.length} rules : ${names.join(', ')}`);
}

function report(matches, failures) {
  const histogram = {};
  for (const names of matches.values()) {
    histogram[names.length] = (histogram[names.length] ?? 0) + 1;
  }
  const spread = Object.keys(histogram)
    .sort()
    .map((n) => `${n}:${histogram[n]}`)
    .join('  ');

  console.log(`rules par fichier (nombre:fichiers)  ${spread}`);
  if (failures.length === 0) return console.log('couverture des rules : OK');

  console.error(`\n${failures.length} violation(s) :`);
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error('\nVoir .claude/rules/ et docs/architecture-back.md.');
}

/** Les rules sans frontmatter `paths` sont toujours chargees : hors sujet ici. */
function loadPathScopedRules() {
  return readdirSync(join(ROOT, '.claude/rules'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({ name: name.replace(/\.md$/, ''), globs: declaredPaths(name) }))
    .filter((rule) => rule.globs.length > 0)
    .map(({ name, globs }) => {
      const patterns = globs.map(globToRegExp);
      return { name, matches: (file) => patterns.some((p) => p.test(file)) };
    });
}

function declaredPaths(ruleName) {
  const text = readFileSync(join(ROOT, '.claude/rules', ruleName), 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return [];

  return [...frontmatter[1].matchAll(/^\s*-\s*"(.+)"\s*$/gm)].map((m) => m[1]);
}

/**
 * Traduit les motifs reellement utilises : `**` (zero ou plusieurs segments),
 * `*` (un segment, sans traverser un /), et `{a,b}` (alternative).
 */
function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const consumed = translate(glob, i);
    out += consumed.pattern;
    i += consumed.skip;
  }
  return new RegExp(`^${out}$`);
}

function translate(glob, i) {
  const char = glob[i];
  if (char === '*' && glob[i + 1] === '*' && glob[i + 2] === '/') {
    return { pattern: '(?:[^/]+/)*', skip: 2 };
  }
  if (char === '*' && glob[i + 1] === '*') return { pattern: '.*', skip: 1 };
  if (char === '*') return { pattern: '[^/]*', skip: 0 };
  if (char === '{') return alternation(glob, i);

  return { pattern: escapeLiteral(char), skip: 0 };
}

function alternation(glob, i) {
  const close = glob.indexOf('}', i);
  if (close === -1) return { pattern: escapeLiteral('{'), skip: 0 };

  const alternatives = glob.slice(i + 1, close).split(',');
  const pattern = `(?:${alternatives.map(escapeAll).join('|')})`;

  return { pattern, skip: close - i };
}

function escapeLiteral(char) {
  return '.+^$()|[]\\{}'.includes(char) ? `\\${char}` : char;
}

function escapeAll(text) {
  return text.replace(/[.+^$()|[\]\\{}]/g, '\\$&');
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    if (!/\.tsx?$/.test(entry.name)) return [];

    return [relative(ROOT, absolute).split('\\').join('/')];
  });
}
