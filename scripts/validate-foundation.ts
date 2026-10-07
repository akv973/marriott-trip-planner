import { loadFoundation } from '../lib/catalog/foundation';

const result = loadFoundation();
if (!result.success) {
  console.error('Foundation validation failed:');
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join('.') || 'root'}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('PASS: Stage 0 manifest and all five intentionally empty collections validate.');
}
