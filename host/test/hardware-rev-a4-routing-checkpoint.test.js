import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

test('rev A4 captures the routing checkpoint and do-not-pay gate', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a4/tellmelight_rev_a4.kicad_pcb');
  const walkthrough = await readText('hardware/notes/rev-a4-circuit-walkthrough.md');
  const checkpoint = await readText('hardware/notes/rev-a4-routing-checkpoint.md');

  for (const token of [
    'TellMeLight Rev A4',
    'By Joey.qiao',
    'routing complete marker',
    'C18',
    'RP2040_VREG_OUT',
  ]) {
    assert.match(pcb, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const token of [
    'USB-C',
    'VBUS',
    'VLED',
    '3V3',
    'RP2040',
    'QSPI flash',
    'LP5024RSMR',
    'current sink',
    'I2C',
    'ESD',
    'crystal',
    'power-budget simulation',
    'manual PCB inspection checklist',
  ]) {
    assert.match(walkthrough, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(checkpoint, /NOT_FOR_PAYMENT/);
  assert.match(checkpoint, /DRC: 0 error violations, 0 unconnected items, and 9 `via_dangling` warnings/);
  assert.match(checkpoint, /0\.45 mm outer diameter \/ 0\.30 mm drill/);
  assert.match(checkpoint, /placement\/fanout revision/);
});
