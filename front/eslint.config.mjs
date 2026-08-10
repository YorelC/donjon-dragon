import {
  baseConfig,
  frontConfig,
  frontPagesConfig,
  frontViewConfig,
  frontViewPurityConfig,
  ignores,
} from "../eslint.config.base.mjs";

// Code généré par le CLI shadcn : on ne le refactore pas, il se régénère.
const vendoredShadcn = [
  {
    files: ["src/shared/components/atoms/**"],
    rules: { "max-lines-per-function": "off", "max-lines": "off" },
  },
];

// frontConfig réarme max-lines sur tout src/**, y compris les tests : il faut
// donc redire ici ce que baseConfig avait déjà desserré pour eux. Un fichier de
// test est une liste de cas, pas une unité de logique — il n'a pas de taille cible.
const testFiles = [
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "max-lines": "off" },
  },
];

// Plus aucun override de dette : les lots du dégraissage sont tous passés.
// On n'en réintroduit pas.
export default [
  ignores,
  ...baseConfig,
  ...frontConfig,
  ...frontPagesConfig,
  ...frontViewConfig,
  ...frontViewPurityConfig,
  ...vendoredShadcn,
  ...testFiles,
];
