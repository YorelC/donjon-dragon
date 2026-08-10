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
    rules: { "max-lines-per-function": "off" },
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
];
