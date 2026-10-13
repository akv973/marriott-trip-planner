import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import locations from '../data/maps/locations.json';
import { validateLocations } from '../lib/maps/locations';
import { rawCatalog, loadCatalog } from '../lib/catalog/catalog';
import { propertyLocation } from '../lib/maps/geography';

const asOf = new Date().toISOString().slice(0, 10);
const result = validateLocations(locations, rawCatalog.properties, asOf);
if (!result.success) throw new Error(result.errors.join('\n'));
if (result.records.length !== 100 || rawCatalog.properties.length !== 100) throw new Error('Maps must review the existing 100 properties without expansion.');
const catalog = loadCatalog(asOf);
if (!catalog.success) throw new Error('Coordinate evidence fails catalog admission.');
const land = readFileSync(new URL('../data/maps/land.json', import.meta.url), 'utf8');
z.array(z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])).min(4)).min(1).parse(JSON.parse(land));
const mapped = catalog.data.properties.filter(p => propertyLocation(catalog.data, p, asOf).coordinate);
console.log(JSON.stringify({ stage: 11, asOf, catalogProperties: catalog.data.properties.length, reviewed: result.records.length,
  mapped: mapped.length, unmapped: catalog.data.properties.length - mapped.length,
  unmappedPropertyIds: catalog.data.properties.filter(p => !mapped.includes(p)).map(p => p.id),
  coordinateClaims: catalog.data.evidenceClaims.filter(c => ['latitude', 'longitude'].includes(c.subject)).length,
  mapSources: catalog.data.sources.filter(s => s.id.startsWith('source-map-')).length,
  coordinateSchemaErrors: result.errors.length, missingCriticalEvidence: catalog.health.missingCriticalEvidence,
  missingOptionalEvidence: catalog.health.missingOptionalEvidence, conflictingSubjects: catalog.health.conflictingSubjects,
  landSha256: createHash('sha256').update(land).digest('hex'),
}, null, 2));
