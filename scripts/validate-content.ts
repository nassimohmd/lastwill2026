/**
 * Wired as the `prebuild` script (package.json) so a bad content/*.json edit
 * — from Pages CMS or by hand — fails the build with a readable message
 * instead of shipping a broken interview. Loading content/load.ts is itself
 * part of what can fail (a duplicate derived key, a section referencing an
 * unknown question id both throw at import time) — dynamic import lets us
 * catch that too, not just the checks in src/content/validate.ts.
 */
async function main() {
  let mod: typeof import('../src/content/validate');
  try {
    mod = await import('../src/content/validate');
  } catch (e) {
    console.error('\nContent failed to load:\n');
    console.error(' -', (e as Error).message);
    process.exitCode = 1;
    return;
  }

  const errors = mod.validateContent();
  if (errors.length > 0) {
    console.error(`\nContent validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):\n`);
    for (const e of errors) console.error(' -', e);
    process.exitCode = 1;
    return;
  }

  console.log('Content validation passed.');
}

main();
