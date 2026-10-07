import { describe, expect, it } from 'vitest';
import { loadCatalog, rawCatalog } from '../../lib/catalog/catalog';
import { assessCatalog } from '../../lib/catalog/health';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AS_OF, fixtureCatalog } from '../fixtures/catalog';

describe('Shipped Stage 1 catalog ingestion', () => {
  it('loads all six entity collections with verified baseline coverage', () => {
    const result = loadCatalog('2026-10-07');
    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Shipped catalog must validate.');
    expect(result.data.properties).toHaveLength(25);
    expect(result.data.brands).toHaveLength(6);
    expect(new Set(result.data.properties.map((property) => property.country)).size).toBe(14);
    expect(result.data.editorialAssessments[0]?.kind).toBe('editorial');
    expect(result.health).toMatchObject({ schemaErrors: 0, orphanedReferences: 0, duplicateIds: 0, duplicateSlugs: 0,
      missingCriticalEvidence: 0, conflictingSubjects: 0, incompleteRecords: 25, missingCoordinates: 25,
      totalSources: 25, totalEvidenceClaims: 260, confidenceCounts: { High: 185, Medium: 75, Low: 0, Unverified: 0 } });
    expect(result.health.staleEvidence).toEqual([]);
  });
  it('keeps optional omissions safe throughout loading and health reporting', () => {
    const catalog = structuredClone(rawCatalog);
    for (const property of catalog.properties) {
      delete (property as Partial<typeof property>).latitude;
      delete (property as Partial<typeof property>).longitude;
      delete (property as Partial<typeof property>).openingYear;
    }
    expect(assessCatalog(catalog, '2026-10-07').success).toBe(true);
  });
  it('reports affiliation staleness over time without mutating original data', () => {
    const result = loadCatalog('2027-05-01');
    expect(result.success).toBe(true);
    expect(result.health.staleEvidence).toHaveLength(25);
    expect(rawCatalog.evidenceClaims[0]?.lastVerifiedAt).toBe('2026-10-07');
  });
  it('runs the CLI against external data and exits nonzero on structural errors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'catalog-validation-'));
    const input = join(dir, 'input.json');
    const args = ['--import', 'tsx', 'scripts/validate-catalog.ts', '--input', input, '--as-of', AS_OF];
    try {
      writeFileSync(input, JSON.stringify(fixtureCatalog()));
      const valid = spawnSync(process.execPath, args, { encoding: 'utf8' });
      expect(valid.status).toBe(0); expect(JSON.parse(valid.stdout).invalidRecords).toBe(0);
      const broken = fixtureCatalog(); broken.sources = [];
      writeFileSync(input, JSON.stringify(broken));
      const invalid = spawnSync(process.execPath, args, { encoding: 'utf8' });
      expect(invalid.status).toBe(1); expect(JSON.parse(invalid.stdout).orphanedReferences).toBe(7);
      const dateError = spawnSync(process.execPath, args.map((arg) => arg === AS_OF ? 'invalid-date' : arg), { encoding: 'utf8' });
      expect(dateError.status).toBe(1);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
