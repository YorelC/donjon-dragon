import { describe, expect, it } from 'vitest';
import { isAllowedSocketOrigin } from './secure-socket-io.adapter';

const ALLOWED_ORIGIN = 'http://localhost:5173';
const ORIGINS = new Set([ALLOWED_ORIGIN]);

describe('isAllowedSocketOrigin', () => {
  it('accepte une origine explicitement autorisée', () => {
    expect(isAllowedSocketOrigin(ALLOWED_ORIGIN, ORIGINS)).toBe(true);
  });

  it('refuse une origine étrangère ou absente', () => {
    expect(isAllowedSocketOrigin('https://hostile.example', ORIGINS)).toBe(false);
    expect(isAllowedSocketOrigin(undefined, ORIGINS)).toBe(false);
  });
});
