import { describe, expect, it } from 'vitest';
import foundation from '../../data/foundation.json';
import { validateFoundation } from '../../lib/validation/foundation';

function validBundle() {
  return { foundation: structuredClone(foundation), properties: [], brands: [], destinations: [], benefits: [], sources: [] };
}

describe('Stage 0 validation boundary', () => {
  it('accepts the intentionally empty foundation', () => {
    expect(validateFoundation(validBundle()).success).toBe(true);
  });

  it('rejects unsupported schema versions', () => {
    const bundle = validBundle();
    bundle.foundation.schemaVersion = '99';
    expect(validateFoundation(bundle).success).toBe(false);
  });

  it('rejects unintended stage progression', () => {
    const bundle = validBundle();
    bundle.foundation.stage = 1;
    expect(validateFoundation(bundle).success).toBe(false);
  });

  it('rejects duplicate roadmap identifiers', () => {
    const bundle = validBundle();
    const module = bundle.foundation.modules[0];
    if (!module) throw new Error('Expected roadmap fixture.');
    bundle.foundation.modules[1] = structuredClone(module);
    expect(validateFoundation(bundle).success).toBe(false);
  });

  it('rejects unknown fields instead of silently dropping them', () => {
    expect(validateFoundation({ ...validBundle(), rates: [] }).success).toBe(false);
  });

  it('rejects prematurely seeded hotel records', () => {
    expect(validateFoundation({ ...validBundle(), properties: [{ name: 'Unsupported claim' }] }).success).toBe(false);
  });

  it('rejects missing collections and null input without throwing', () => {
    const { sources: _sources, ...missingCollection } = validBundle();
    void _sources;
    expect(validateFoundation(missingCollection).success).toBe(false);
    expect(validateFoundation(null).success).toBe(false);
  });

  it('rejects blank descriptive text', () => {
    const bundle = validBundle();
    const module = bundle.foundation.modules[0];
    if (!module) throw new Error('Expected roadmap fixture.');
    module.title = '   ';
    expect(validateFoundation(bundle).success).toBe(false);
  });
});
