import { baseConfig, ignores } from "../eslint.config.base.mjs";

// Aucun override : les frontieres d'architecture du back sont armees par
// dependency-cruiser (.dependency-cruiser.cjs), execute par `pnpm lint`.
export default [ignores, ...baseConfig];
