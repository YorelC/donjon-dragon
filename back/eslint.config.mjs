import { baseConfig, ignores } from "../eslint.config.base.mjs";

// DETTE — overrides temporaires, à résorber lot par lot en phase 3 du
// dégraissage. Inventaire et plan : docs/refactor/audit-degraissage.md.
// Chaque ligne supprimée ici est un lot terminé.
const debt = [
  {
    files: [
      "src/auth/02-application/login.use-case.ts",
      "src/auth/02-application/refresh-tokens.use-case.ts",
      "src/auth/02-application/verify-email.use-case.ts",
      "src/friendship/01-interface/friendship.controller.ts",
    ],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: [
      "src/auth/02-application/register.use-case.ts",
      "src/friendship/01-interface/friendship.controller.ts",
      "src/scripts/**",
    ],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
];

export default [ignores, ...baseConfig, ...debt];
