import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

function literalPattern(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('rev A1 spec records JLC-oriented manufacturing decisions', async () => {
  const spec = await readText('docs/superpowers/specs/2026-05-30-rev-a1-jlc-fabrication-candidate-design.md');

  assert.match(spec, /4-layer PCB/);
  assert.match(spec, /double-sided SMT/);
  assert.match(spec, /pogo\/test pads/);
  assert.match(spec, /C427525/);
  assert.match(spec, /C2827321/);
});

test('rev A1 generated files contain the required JLC candidate components', async () => {
  const bom = await readText('hardware/bom/rev_a1_bom.csv');
  const sourcing = await readText('hardware/bom/rev_a1_jlc_sourcing.csv');

  for (const token of ['RP2040', 'LP5024RSMR', 'W25Q32JVSSIQ', 'AP2112K-3.3TRG1', 'TPD2EUSB30DRTR', 'TYPE-C-31-M-12', 'S4-3528RGBTA-A']) {
    assert.match(bom, literalPattern(token));
  }

  for (const code of ['C2040', 'C427525', 'C82344', 'C51118', 'C94934', 'C165948', 'C2827321']) {
    assert.match(sourcing, literalPattern(code));
  }
});

test('rev A1 KiCad PCB reflects 4-layer JLC productization direction', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb');

  for (const ref of ['U1', 'U2', 'U3', 'U4', 'U5', 'J1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'TP_SWDIO', 'TP_SWCLK']) {
    assert.match(pcb, new RegExp(`\\b${ref}\\b`));
  }

  assert.match(pcb, /In1\.Cu/);
  assert.match(pcb, /In2\.Cu/);
  assert.match(pcb, /LED_RGB_Wuerth-PLCC4_3\.2x2\.8mm/);
  assert.doesNotMatch(pcb, /PinHeader_1x05/);
});

test('rev A1 readiness and power notes capture no-hand-solder review gates', async () => {
  const readiness = await readText('hardware/notes/rev-a1-jlc-readiness.md');
  const power = await readText('hardware/simulation/rev_a1_power_budget.md');

  assert.match(readiness, /No assumed user hand-soldering/);
  assert.match(readiness, /JLC DFM review/);
  assert.match(readiness, /double-sided SMT/);
  assert.match(power, /Typical visible load/);
  assert.match(power, /USB current target/);
});

test('rev A1 preview summarizes render outputs and cost uncertainty', async () => {
  const preview = await readText('hardware/outputs/rev_a1/preview.html');
  const cost = await readText('hardware/outputs/rev_a1/cost-estimate.md');
  const costCsv = await readText('hardware/outputs/rev_a1/cost-estimate.csv');

  assert.match(preview, /TellMeLight Rev A1 Preview/);
  assert.match(preview, /tellmelight_rev_a1_top\.png/);
  assert.match(preview, /tellmelight_rev_a1_bottom\.png/);
  assert.match(preview, /Known priced component subtotal/);
  assert.match(cost, /PCB fabrication, SMT assembly, tooling, tax, and shipping are not included/);
  assert.match(cost, /C82344 currently shows stock risk/);
  assert.match(costCsv, /Known priced component subtotal/);
  assert.match(costCsv, /JLC quote upload required/);
});
