import { readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { test, expect } from './fixtures/test';
import { EMAIL_CAPTURE_PATH } from './fixtures/email-capture';

const VerificationUrlSchema = z.string().url();
const E2E_PASSWORD = 'E2eRegistration42';

test('inscription, vérification du courriel et ouverture de session', async ({
  page,
  registerPage,
}) => {
  await rm(EMAIL_CAPTURE_PATH, { force: true });
  await registerPage.goto();
  await registerPage.submit(registrationValues());
  await expect(registerPage.success).toBeVisible();

  await expect.poll(readCapturedUrl).not.toBe('');
  const verificationUrl = VerificationUrlSchema.parse(await readCapturedUrl());
  await page.goto(verificationUrl);

  await expect(page).toHaveURL(/\/campaigns$/);
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible();
});

function registrationValues() {
  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  return {
    email: `e2e-${id}@donjon-dragon.test`,
    displayName: `E2e${id}`,
    password: E2E_PASSWORD,
  };
}

async function readCapturedUrl(): Promise<string> {
  return readFile(EMAIL_CAPTURE_PATH, 'utf8').catch(() => '');
}
