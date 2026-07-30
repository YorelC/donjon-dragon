import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

// Limite de corps de fonction (AGENTS.md § Architecture stricte).
// Les views et les pages ont droit à plus : leur corps est du JSX, pas de la logique.
const MAX_FUNCTION_LINES = 20;
const MAX_VIEW_LINES = 60;

const FUNCTION_SIZE_OPTIONS = {
  max: MAX_FUNCTION_LINES,
  skipBlankLines: true,
  skipComments: true,
};

// Primitives d'UI : elles n'existent que derrière un wrapper de shared/components.
const UI_PRIMITIVE_IMPORTS = {
  paths: [
    {
      name: "radix-ui",
      message: "Primitive radix : passe par un wrapper de @/shared/components.",
    },
    {
      name: "@shadcn/react",
      message: "Primitive shadcn : passe par un wrapper de @/shared/components.",
    },
    {
      name: "cmdk",
      message: "Primitive cmdk : passe par @/shared/components/atoms/command.",
    },
  ],
  patterns: [
    {
      group: ["@radix-ui/*"],
      message: "Primitive radix : passe par un wrapper de @/shared/components.",
    },
  ],
};

// Frontière entre pages : le _internal d'une page ne sort jamais de cette page.
// Ce qui doit être partagé remonte dans shared/ par un commit dédié.
const CROSS_PAGE_INTERNAL_IMPORTS = {
  patterns: [
    {
      group: [
        "@/pages/*/_internal/**",
        "@/pages/*/*/_internal/**",
        "../../../**/_internal/**",
      ],
      message:
        "_internal appartient à une seule page. Remonte le code dans @/shared si tu en as besoin ailleurs.",
    },
  ],
};

function mergeRestrictedImports(...configs) {
  return [
    "error",
    {
      paths: configs.flatMap((config) => config.paths ?? []),
      patterns: configs.flatMap((config) => config.patterns ?? []),
    },
  ];
}

export const ignores = {
  ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "**/*.d.ts"],
};

// Socle commun aux 3 paquets.
export const baseConfig = tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "max-lines-per-function": ["error", FUNCTION_SIZE_OPTIONS],
      "@typescript-eslint/no-explicit-any": "error",
      // Le préfixe _ est la façon documentée de dire « paramètre imposé par
      // le port, volontairement ignoré » (adapters in-memory, notamment).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // Un describe() ou un it() est un conteneur, pas une unité de logique.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "max-lines-per-function": "off" },
  },
);

// Règles propres au front (structure pages/ + shared/).
export const frontConfig = tseslint.config({
  files: ["src/**/*.ts", "src/**/*.tsx"],
  languageOptions: {
    globals: { ...globals.browser },
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  rules: {
    "no-restricted-imports": mergeRestrictedImports(CROSS_PAGE_INTERNAL_IMPORTS),
  },
});

// Les primitives ne sont interdites qu'en dehors de leurs wrappers.
export const frontPagesConfig = tseslint.config({
  files: ["src/pages/**/*.ts", "src/pages/**/*.tsx", "src/App.tsx"],
  rules: {
    "no-restricted-imports": mergeRestrictedImports(
      UI_PRIMITIVE_IMPORTS,
      CROSS_PAGE_INTERNAL_IMPORTS,
    ),
  },
});

export const frontViewConfig = tseslint.config({
  files: ["src/**/*.view.tsx", "src/**/*.page.tsx"],
  rules: {
    "max-lines-per-function": [
      "error",
      { ...FUNCTION_SIZE_OPTIONS, max: MAX_VIEW_LINES },
    ],
  },
});
