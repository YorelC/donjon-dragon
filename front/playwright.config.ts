import { defineConfig, devices } from '@playwright/test';

/**
 * Un seul etage de tests, pour une seule chose : ce qu'un VRAI navigateur prouve
 * et que jsdom ne peut pas prouver.
 *
 * jsdom n'implemente pas la semantique `HttpOnly` — dans un test unitaire,
 * `document.cookie` rend ce qu'on y a mis. L'affirmation centrale de la session en
 * cookies, « aucun script de la page ne peut lire les tokens », y est donc
 * intestable. Ici elle est verifiee en executant du JavaScript DANS la page.
 *
 * Volontairement chromium seul : ces tests portent sur des mecanismes HTTP
 * standards, pas sur du rendu. Tripler le temps d'execution pour les rejouer sur
 * firefox et webkit n'apporterait rien.
 *
 * Ne fait PAS partie de `pnpm test` : ces tests demandent Mongo, un back compile
 * et un vrai navigateur. Ils se lancent par `pnpm --filter front test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  // Un seul worker : les tests partagent les comptes du seed et se marcheraient
  // sur les pieds (rotation de refresh token, demandes d'ami en doublon).
  workers: 1,
  fullyParallel: false,
  // Un echec ici est un signal, pas du bruit a reessayer jusqu'a ce qu'il passe.
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Ouvre les sessions une fois pour toutes (cf. fixtures/storage-state.ts).
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: [
    {
      // `port` et non `url` : toutes les routes de l'API repondent 401 sans
      // cookie, et l'attente sur `url` exige un 2xx/3xx.
      command: 'pnpm build && node dist/back/src/main.js',
      // Depuis back/, et pas depuis la racine : `dotenv/config` lit le .env du
      // repertoire COURANT. Lance ailleurs, le back demarre sans configuration et
      // meurt sur la validation Zod — ce qui est le bon comportement, mais pas ici.
      cwd: '../back',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
