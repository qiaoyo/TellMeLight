import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

test('rev A hardware spec records approved electrical and visual decisions', async () => {
  const spec = await readText('docs/superpowers/specs/2026-05-30-rev-a-kicad-hardware-design.md');

  assert.match(spec, /RP2040/);
  assert.match(spec, /LP5024/);
  assert.match(spec, /USB-C/);
  assert.match(spec, /Six logical session slots/);
  assert.match(spec, /VQFN-32/);
  assert.match(spec, /four ByteDance-style vertical diffuser bars/);
});

test('rev A generated BOM contains the required baseline components', async () => {
  const bom = await readText('hardware/bom/rev_a_bom.csv');

  assert.match(bom, /RP2040/);
  assert.match(bom, /LP5024/);
  assert.match(bom, /W25Q32/);
  assert.match(bom, /AP2112K/);
  assert.match(bom, /TPD2EUSB30/);
  assert.match(bom, /USB_C/);
  assert.match(bom, /RGB_LED/);
});

test('rev A KiCad PCB contains the required placed references', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb');

  for (const ref of ['U1', 'U2', 'J1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'SWD1', 'SW1', 'SW2']) {
    assert.match(pcb, new RegExp(`\\b${ref}\\b`));
  }

  assert.match(pcb, /TellMeLight Rev A/);
  assert.match(pcb, /Edge\.Cuts/);
});

test('rev A KiCad project and power budget are present', async () => {
  const project = await readText('hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pro');
  const power = await readText('hardware/simulation/rev_a_power_budget.md');

  assert.match(project, /tellmelight_rev_a/);
  assert.match(power, /Typical visible load/);
  assert.match(power, /Worst-case all channels/);
});
