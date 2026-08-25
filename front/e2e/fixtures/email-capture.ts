import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const EMAIL_CAPTURE_PATH = join(
  tmpdir(),
  'donjon-dragon-e2e-verification-url.txt',
);
