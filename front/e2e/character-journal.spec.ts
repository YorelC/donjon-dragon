import type { Page } from '@playwright/test';
import { test, expect, STORAGE_STATE } from './fixtures/test';
import { deleteCharactersNamed, ensureCampaign } from './fixtures/api';
import { BuilderAutopilot } from './pages/builder-autopilot';
import { CharacterBuilderPage } from './pages/character-builder.page';

/**
 * Le journal de bord d'un personnage (spec 013), dans un vrai navigateur.
 *
 * Gandalf est MJ de la campagne et le personnage qu'il crée n'a pas de joueur :
 * il en écrit donc le journal. Ce qui se prouve ici et pas en vitest : que la
 * sauvegarde automatique atteint le serveur, qu'un rechargement retrouve le texte,
 * et que deux onglets sur le même chapitre ouvrent le choix entre les versions.
 * La lecture seule du MJ face à un personnage qui a son joueur est couverte par
 * les tests du back et des views.
 */
test.use({ storageState: STORAGE_STATE.gandalf });

const CAMPAIGN_NAME = 'E2E journal de bord';
const CHARACTER_NAME = 'Journal E2E';
const SAVED = 'Enregistré';
const BODY_FIELD = /Écrivez en Markdown/;

// Une flèche prise en compte déplace la ligne voisine presque aussitôt ; au-delà, on la renvoie.
const ARROW_EFFECT_TIMEOUT_MS = 500;

let sheetUrl: string;

// Supprimer l'homonyme d'un passage précédent emporte aussi son journal.
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage({ storageState: STORAGE_STATE.gandalf });
  const campaignId = await ensureCampaign(page.request, CAMPAIGN_NAME);
  await deleteCharactersNamed(page.request, campaignId, CHARACTER_NAME);
  await createCharacter(page, campaignId);
  sheetUrl = page.url();
  await page.close();
});

test.describe.serial('Journal de bord', () => {
  test('écrit un chapitre, le relit verrouillé en Markdown après rechargement', async ({ page }) => {
    await openJournal(page);
    await page.getByRole('button', { name: 'Nouveau chapitre' }).click();
    await page.getByRole('textbox', { name: 'Titre du chapitre' }).fill('La taverne');
    await page.getByRole('textbox', { name: BODY_FIELD }).fill('- [x] Le forgeron **ment**');
    await expect(page.getByRole('status').filter({ hasText: SAVED })).toBeVisible();

    await page.getByRole('button', { name: 'Verrouiller' }).click();
    await expect(page.getByRole('checkbox')).toBeChecked();

    await page.reload();
    await openJournal(page);
    await expect(page.getByText('ment', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Déverrouiller' })).toBeVisible();
  });

  test('réordonne les chapitres au clavier', async ({ page }) => {
    await openJournal(page);
    await page.getByRole('button', { name: 'Nouveau chapitre' }).click();
    await page.getByRole('textbox', { name: 'Titre du chapitre' }).fill('Le forgeron');
    await expect(chapterButton(page, 'Le forgeron')).toBeVisible();

    await moveWithKeyboard(page, 'Le forgeron', 'ArrowUp');

    await expect(page.locator('.journal-chapter-button').first()).toHaveText('Le forgeron');
    await page.reload();
    await openJournal(page);
    await expect(page.locator('.journal-chapter-button').first()).toHaveText('Le forgeron');
  });

  test('garde le chapitre ouvert quand on le déplace sans l avoir choisi', async ({ page }) => {
    await openJournal(page);
    await expect(chapterButton(page, 'Le forgeron')).toHaveAttribute('aria-current', 'true');

    await moveWithKeyboard(page, 'Le forgeron', 'ArrowDown');

    await expect(page.locator('.journal-chapter-button').first()).toHaveText('La taverne');
    await expect(chapterButton(page, 'Le forgeron')).toHaveAttribute('aria-current', 'true');
  });

  test('demande quelle version garder quand un autre onglet a enregistré', async ({ page, context }) => {
    const other = await context.newPage();
    await openUnlocked(page, 'La taverne');
    await openUnlocked(other, 'La taverne');

    await other.getByRole('textbox', { name: BODY_FIELD }).fill('Version du téléphone');
    await expect(other.getByRole('status').filter({ hasText: SAVED })).toBeVisible();
    await page.getByRole('textbox', { name: BODY_FIELD }).fill('Version de l’ordinateur');

    await expect(page.getByRole('alertdialog')).toContainText('modifié ailleurs');
    await page.getByRole('button', { name: 'Garder ma version' }).click();
    await expect(page.getByRole('status').filter({ hasText: SAVED })).toBeVisible();

    await other.reload();
    await openJournal(other);
    await chapterButton(other, 'La taverne').click();
    await expect(other.getByText('Version de l’ordinateur')).toBeVisible();
  });

  test('supprime un chapitre après confirmation', async ({ page }) => {
    await openJournal(page);
    await chapterButton(page, 'Le forgeron').click();
    await page.getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Supprimer « Le forgeron » ?');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click();

    await expect(chapterButton(page, 'Le forgeron')).toHaveCount(0);
    await expect(chapterButton(page, 'La taverne')).toHaveAttribute('aria-current', 'true');
  });
});

async function createCharacter(page: Page, campaignId: string): Promise<void> {
  const builder = new CharacterBuilderPage(page);
  const autopilot = new BuilderAutopilot(builder);
  await builder.gotoNew(campaignId);
  await builder.choose('Goliath');
  await autopilot.fillBetween('Espèce', 'Classe');
  await builder.openStep('Classe');
  await builder.choose('Barbare');
  await builder.openStep('Historique');
  await builder.choose('Soldat');
  await autopilot.fillBetween('Historique', 'Identité');
  await builder.openStep('Identité');
  await builder.fillIdentity({
    name: CHARACTER_NAME, alignment: 'Neutre pur', age: '40',
    heightCm: '225', weightKg: '150', description: 'Barbare goliath, carnet à la ceinture.',
  });
  await builder.waitForServerPreview();
  await builder.finishCreation();
}

/**
 * Espace saisit, la flèche déplace, Espace pose. Le capteur clavier ne suit la
 * ligne saisie qu'une fois les lignes mesurées : une flèche partie trop tôt ne
 * fait rien, on la répète jusqu'à ce que la ligne voisine s'écarte. Contre un
 * bord, une flèche de trop est sans effet.
 */
async function moveWithKeyboard(
  page: Page,
  title: string,
  arrow: 'ArrowUp' | 'ArrowDown',
): Promise<void> {
  const handle = page.getByRole('button', { name: `Déplacer ${title}` });
  const neighbour = page.locator('[data-slot=sortable-item]:not([data-dragging])').first();
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  await expect(async () => {
    await page.keyboard.press(arrow);
    await expect(neighbour).toHaveAttribute('style', /translate3d\(0px, -?[1-9]/, { timeout: ARROW_EFFECT_TIMEOUT_MS });
  }).toPass();
  await page.keyboard.press('Space');
}

async function openJournal(page: Page): Promise<void> {
  if (page.url() !== sheetUrl) await page.goto(sheetUrl);
  await page.getByRole('tab', { name: 'Journal' }).click();
  await expect(page.getByRole('navigation', { name: 'Chapitres' })).toBeVisible();
}

async function openUnlocked(page: Page, title: string): Promise<void> {
  await openJournal(page);
  await chapterButton(page, title).click();
  await page.getByRole('button', { name: 'Déverrouiller' }).click();
}

function chapterButton(page: Page, title: string) {
  return page.getByRole('navigation', { name: 'Chapitres' }).getByRole('button', { name: title, exact: true });
}
