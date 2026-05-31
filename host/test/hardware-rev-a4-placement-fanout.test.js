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
  const errors = (drc.violations ?? []).filter((violation) => violation.severity === 'error');

  assert.equal(errors.length, 0);
  assert.equal((drc.unconnected_items ?? []).length, 0);
  assert.match(summary, /DRC: 0 error violations, 0 unconnected items, and 9 via_dangling warnings/);
  assert.match(checkpoint, /READY_FOR_JLC_PREVIEW_NOT_PAYMENT/);
});

test('rev A4 uses free ordinary JLC via geometry, not paid small-hole values', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a4/tellmelight_rev_a4.kicad_pcb');
  const project = JSON.parse(await readText('hardware/kicad/tellmelight_rev_a4/tellmelight_rev_a4.kicad_pro'));
  const summary = await readText('hardware/outputs/rev_a4/verification-summary.md');
  const checkpoint = await readText('hardware/notes/rev-a4-routing-checkpoint.md');

  const vias = [...pcb.matchAll(/\(via\s+[\s\S]*?\(size\s+([0-9.]+)\)\s+[\s\S]*?\(drill\s+([0-9.]+)\)/g)]
    .map((match) => ({
      size: Number(match[1]),
      drill: Number(match[2]),
    }));

  assert.ok(vias.length > 0, 'expected routed PCB to contain vias');
  assert.doesNotMatch(pcb, /ThermalVias/, 'Rev A4 should not use footprint-embedded 0.20mm thermal via holes');
  assert.ok(Math.min(...vias.map((via) => via.size)) >= 0.45, 'via outer diameter must match JLC free 0.3mm drill option');
  assert.ok(Math.min(...vias.map((via) => via.drill)) >= 0.3, 'via drill must match JLC free 0.3mm drill option');
  assert.equal(project.net_settings.classes[0].via_diameter, 0.45);
  assert.equal(project.net_settings.classes[0].via_drill, 0.3);
  assert.equal(project.net_settings.classes[0].clearance, 0.1);
  assert.doesNotMatch(summary, /0\.25 mm drill/);
  assert.doesNotMatch(checkpoint, /0\.25 mm drill/);
  assert.doesNotMatch(summary, /0\.10 mm drill \/ 0\.25 mm via/);
  assert.doesNotMatch(checkpoint, /0\.10 mm drill \/ 0\.25 mm via/);
  assert.match(summary, /free ordinary JLC/i);
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
