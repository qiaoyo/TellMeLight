import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

function literalPattern(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('rev A2 pin map documents the main electrical interfaces', async () => {
  const pinMap = await readText('hardware/notes/rev-a2-pin-map.md');

  for (const token of [
    'RP2040',
    'LP5024RSMR',
    'USB-C',
    'QSPI flash',
    'RGB LED',
    'USB_DP',
    'USB_DM',
    'OUT0',
    'OUT17',
    'SWDIO',
    'SWCLK',
  ]) {
    assert.match(pinMap, literalPattern(token));
  }
});

test('rev A2 sourcing decisions expose flash and RGB LED risks', async () => {
  const sourcing = await readText('hardware/notes/rev-a2-sourcing-decisions.md');

  assert.match(sourcing, /C82344/);
  assert.match(sourcing, /C179173/);
  assert.match(sourcing, /stock risk/);
  assert.match(sourcing, /RGB LED pinout/);
});

test('rev A2 JLC package separates BOM, CPL, and cost model', async () => {
  const bom = await readText('hardware/bom/rev_a2_jlc_bom.csv');
  const cpl = await readText('hardware/bom/rev_a2_jlc_cpl.csv');
  const cost = await readText('hardware/bom/rev_a2_cost_estimate.csv');

  assert.match(bom, /Comment,Designator,Footprint,LCSC Part/);
  assert.match(bom, /C179173/);
  assert.match(cpl, /Designator,Mid X,Mid Y,Layer,Rotation/);
  assert.match(cost, /Known priced component subtotal/);
  assert.match(cost, /JLC quote upload required/);
});

test('rev A2 order readiness keeps unresolved items visible', async () => {
  const readiness = await readText('hardware/notes/rev-a2-order-readiness.md');

  assert.match(readiness, /RED/);
  assert.match(readiness, /YELLOW/);
  assert.match(readiness, /GREEN/);
  assert.match(readiness, /Do not order/);
});

test('rev A2 circuit explanation teaches the current schematic blocks', async () => {
  const explanation = await readText('hardware/notes/rev-a2-circuit-explanation.md');

  for (const token of [
    'USB-C',
    'VBUS',
    '3V3',
    'RP2040',
    'LP5024RSMR',
    'I2C',
    'QSPI flash',
    'RGB LED',
    'current sink',
  ]) {
    assert.match(explanation, literalPattern(token));
  }
});

test('rev A2 verification summary records KiCad checks and export outputs', async () => {
  const summary = await readText('hardware/outputs/rev_a2/verification-summary.md');
  const pcb = await readText('hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb');

  assert.match(summary, /ERC: 0 violations/);
  assert.match(summary, /DRC: 0 violations/);
  assert.match(summary, /Texas_DRT-3/);
  assert.match(summary, /RGB LED pinout remains RED/);
  assert.match(summary, /tellmelight_rev_a2_top\.png/);
  assert.match(pcb, /Texas_DRT-3/);
  assert.match(pcb, /\bR7\b/);
  assert.match(pcb, /\bC15\b/);
});
