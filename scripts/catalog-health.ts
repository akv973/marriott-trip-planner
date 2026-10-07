import { loadFoundation } from '../lib/catalog/foundation';

const result = loadFoundation();
if (!result.success) {
  console.error('Catalog foundation is invalid. Run npm run validate:schema for details.');
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    stage: 0,
    catalogState: result.data.foundation.catalogState,
    properties: result.data.properties.length,
    schemaErrors: 0,
    missingCriticalEvidence: 0,
    conflictingClaims: 0,
    staleClaims: 0,
    unverifiedClaims: 0,
    evidenceAssessed: false,
    confidencePercentages: null,
    note: 'Empty foundation only; domain evidence and catalog quality assessment begin in Stage 1.',
  }, null, 2));
}
