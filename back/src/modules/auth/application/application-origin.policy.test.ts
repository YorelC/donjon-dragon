import { describe, expect, it } from 'vitest';
import {
  ApplicationOriginPolicy,
  UntrustedApplicationOriginError,
} from './application-origin.policy';

describe('ApplicationOriginPolicy', () => {
  const policy = new ApplicationOriginPolicy([
    'http://localhost:5173',
    'https://table.example.com',
  ]);

  it('autorise une origine configurée', () => {
    expect(policy.authorize('https://table.example.com')).toBe('https://table.example.com');
  });

  it('ne conserve que protocole, hôte et port', () => {
    expect(policy.authorize('http://localhost:5173/path?query=1')).toBe(
      'http://localhost:5173',
    );
  });

  it('refuse une origine extérieure', () => {
    expect(() => policy.authorize('https://attacker.example')).toThrow(
      UntrustedApplicationOriginError,
    );
  });
});
