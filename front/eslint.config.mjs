import {
  baseConfig,
  frontConfig,
  frontPagesConfig,
  frontViewConfig,
  ignores,
} from "../eslint.config.base.mjs";

// Code généré par le CLI shadcn : on ne le refactore pas, il se régénère.
const vendoredShadcn = [
  {
    files: ["src/shared/components/atoms/**"],
    rules: { "max-lines-per-function": "off" },
  },
];

// DETTE — overrides temporaires, à résorber lot par lot en phase 3 du
// dégraissage. Inventaire et plan : docs/refactor/audit-degraissage.md.
// Chaque ligne supprimée ici est un lot terminé.
const debt = [
  {
    files: [
      "src/App.tsx",
      "src/pages/**/containers/**",
      "src/pages/**/hooks/**",
      "src/pages/**/views/**",
      "src/shared/api/refresh.ts",
      "src/shared/components/layout/**",
      "src/shared/components/molecules/**",
    ],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: [
      "src/pages/characters/_internal/containers/character-form.container.tsx",
      "src/pages/login/_internal/containers/login.container.tsx",
      "src/shared/api/*.test.ts",
      "src/shared/components/layout/nav.test.tsx",
      "src/shared/components/molecules/**",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
      "no-useless-assignment": "off",
    },
  },
  {
    // nav.tsx consomme le useLogout de la page login : à remonter dans shared/.
    files: ["src/shared/components/layout/nav.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
];

export default [
  ignores,
  ...baseConfig,
  ...frontConfig,
  ...frontPagesConfig,
  ...frontViewConfig,
  ...vendoredShadcn,
  ...debt,
];
