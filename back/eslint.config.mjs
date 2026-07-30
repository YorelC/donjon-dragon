import { baseConfig, ignores } from "../eslint.config.base.mjs";

// DETTE — overrides temporaires, à résorber lot par lot en phase 3 du
// dégraissage. Inventaire et plan : docs/refactor/audit-degraissage.md.
// Chaque ligne supprimée ici est un lot terminé.
const debt = [
  {
    files: [
      "src/auth/02-application/**",
      "src/character/03-domain/**",
      "src/friendship/01-interface/**",
    ],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: [
      "src/auth/02-application/register.use-case.ts",
      "src/character/03-domain/character.entity.ts",
      "src/friendship/01-interface/friendship.controller.ts",
      "src/scripts/**",
    ],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
];

export default [ignores, ...baseConfig, ...debt];
