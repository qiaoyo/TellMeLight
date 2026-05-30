import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test('rev A2 JLC upload package keeps quote files and review blockers together', async () => {
  const manifest = await readJson('hardware/outputs/rev_a2/jlc_upload/manifest.json');
  const readme = await readText('hardware/outputs/rev_a2/jlc_upload/README.md');

  assert.equal(manifest.revision, 'A2');
  assert.equal(manifest.status, 'NOT_FOR_ORDER');
  assert.match(readme, /Do not pay for boards from this package yet/);
  assert.match(readme, /JLC orientation preview/);

  for (const path of [
    'hardware/outputs/rev_a2/jlc_upload/assembly/rev_a2_jlc_bom.csv',
    'hardware/outputs/rev_a2/jlc_upload/assembly/rev_a2_jlc_cpl.csv',
    'hardware/outputs/rev_a2/jlc_upload/review/rev-a2-order-readiness.md',
    'hardware/outputs/rev_a2/jlc_upload/review/rev-a2-led-footprint-review.md',
    'hardware/outputs/rev_a2/jlc_upload/review/verification-summary.md',
  ]) {
    assert.ok((await stat(path)).isFile(), `${path} should exist`);
  }

  assert.ok(manifest.files.some((file) => file.path === 'gerber_drill/tellmelight_rev_a2.drl'));
  assert.ok(manifest.files.some((file) => file.path === 'assembly/rev_a2_jlc_bom.csv'));
  assert.ok(manifest.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256)));
});

test('rev A2 JLC upload package emits nonempty upload zips', async () => {
  const root = 'hardware/outputs/rev_a2/jlc_upload';
  const entries = await readdir(root);

  for (const name of [
    'tellmelight_rev_a2_jlc_gerber_drill.zip',
    'tellmelight_rev_a2_jlc_assembly_bom_cpl.zip',
  ]) {
    assert.ok(entries.includes(name), `${name} should be present`);
    assert.ok((await stat(`${root}/${name}`)).size > 200, `${name} should be nonempty`);
  }
});
