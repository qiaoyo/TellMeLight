import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test('rev A4 placement/fanout revision reaches electrical routing signoff', async () => {
  const drc = await readJson('hardware/outputs/rev_a4/drc.json');
  const summary = await readText('hardware/outputs/rev_a4/verification-summary.md');
  const checkpoint = await readText('hardware/notes/rev-a4-routing-checkpoint.md');

  assert.equal((drc.violations ?? []).length, 0);
  assert.equal((drc.unconnected_items ?? []).length, 0);
  assert.match(summary, /DRC: 0 violations and 0 unconnected items/);
  assert.match(checkpoint, /READY_FOR_JLC_PREVIEW_NOT_PAYMENT/);
});

test('rev A4 records parallel enclosure, glass, and industrial design concepts', async () => {
  const concept = await readText('hardware/notes/rev-a4-enclosure-industrial-concept.md');

  for (const token of [
    'enclosure',
    'glass',
    'industrial design',
    'diffuser',
    'USB-C',
    '76 mm x 56 mm',
    'four-bar',
  ]) {
    assert.match(concept, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
