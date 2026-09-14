/**
 * CLI Entry point to run the verification gate headlessly.
 */
import { runAllTestGates } from './testRunner';

async function main() {
  console.log('\n======================================================');
  console.log(' CHAT CONNECT / MUSCAL TEST GATE VERIFICATION RUNNER');
  console.log('======================================================\n');

  const summary = await runAllTestGates();

  console.log('\nRESULTS BREAKDOWN:');
  summary.results.forEach((r) => {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${status}] [${r.phase}] ${r.name}`);
    if (r.message) {
      console.log(`       ↳ ${r.message}`);
    }
  });

  console.log('\n------------------------------------------------------');
  console.log(`TOTAL: ${summary.total} | PASSED: ${summary.passed} | FAILED: ${summary.failed}`);
  console.log(`DURATION: ${summary.durationMs}ms`);
  console.log('------------------------------------------------------\n');

  if (!summary.allPassed) {
    console.error('VERIFICATION GATE FAILED!');
    process.exit(1);
  } else {
    console.log('ALL ACCEPTANCE GATES PASSED CLEANLY! Ready for Release Tag.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
