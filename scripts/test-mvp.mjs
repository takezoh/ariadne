// Compatibility entrypoint: the typed sources and independent suites are owned
// by the shared runner, not generated into shared checkout-local files.
import { runTests } from './testing/run-tests.mjs';
process.exitCode = runTests(['domain', 'application', 'adapters']);
