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
      "src/pages/login/_internal/containers/login.container.tsx",
      "src/pages/profile/friends/_internal/containers/friends.container.tsx",
      "src/pages/profile/friends/_internal/views/friends.view.tsx",
      "src/pages/register/_internal/containers/register.container.tsx",
      "src/pages/register/_internal/hooks/use-register-form.ts",
      "src/pages/register/_internal/views/register.view.tsx",
      "src/shared/api/refresh.ts",
      "src/shared/components/layout/nav.tsx",
    ],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: [
      "src/pages/login/_internal/containers/login.container.tsx",
      "src/shared/api/*.test.ts",
      "src/shared/components/layout/nav.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
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
