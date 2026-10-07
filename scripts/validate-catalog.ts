import { readFileSync } from 'node:fs';
import { rawCatalog } from '../lib/catalog/catalog';
import { assessCatalog } from '../lib/catalog/health';

// Explicit dates make regression checks repeatable; production defaults to today.
const args = process.argv.slice(2);
function option(name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}
try {
  const asOf = option('--as-of') ?? new Date().toISOString().slice(0, 10);
  const file = option('--input');
  for (let index = 0; index < args.length; index += 2) {
    if (!['--as-of', '--input'].includes(args[index]!)) throw new Error(`Unknown option: ${args[index]}`);
  }
  const input: unknown = file ? JSON.parse(readFileSync(file, 'utf8')) : rawCatalog;
  const result = assessCatalog(input, asOf);
  console.log(JSON.stringify(result.health, null, 2));
  if (!result.success) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Catalog validation failed.');
  process.exitCode = 1;
}
