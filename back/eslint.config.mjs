import { baseConfig, ignores } from "../eslint.config.base.mjs";

// DETTE — overrides temporaires, à résorber lot par lot en phase 3 du
// dégraissage. Inventaire et plan : docs/refactor/audit-degraissage.md.
// Chaque ligne supprimée ici est un lot terminé.
const debt = [
  {
    files: ["src/scripts/**"],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
];

export default [ignores, ...baseConfig, ...debt];
