import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

function literalPattern(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('rev A3 local KiCad symbols encode LP5024RSMR pins', async () => {
  const symbols = await readText('hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym');

  assert.match(symbols, /symbol "LP5024RSMR"/);
  assert.match(symbols, literalPattern('Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias'));

  for (const token of [
    'OUT0',
    'OUT17',
    'OUT23',
    'ADDR0',
    'ADDR1',
    'VCC',
    'SDA',
    'SCL',
    'EN',
    'IREF',
    'VCAP',
    'GND_EP',
  ]) {
    assert.match(symbols, literalPattern(token));
  }
});

test('rev A3 local KiCad symbols encode exact TUOZHAN RGB LED pins', async () => {
  const symbols = await readText('hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym');

  assert.match(symbols, /symbol "LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A"/);
  assert.match(symbols, /S4-3528RGBTA-A/);
  assert.match(symbols, /C2827321/);

  for (const token of [
    'Blue cathode',
    'Common anode',
    'Green cathode',
    'Red cathode',
  ]) {
    assert.match(symbols, literalPattern(token));
  }
});

test('rev A3 symbol library review records KiCad validation and order boundary', async () => {
  const readme = await readText('hardware/kicad/tellmelight_rev_a3/README.md');
  const review = await readText('hardware/notes/rev-a3-symbol-library-review.md');
  const log = await readText('hardware/outputs/rev_a3/symbol-upgrade-check.log');

  assert.match(readme, /TellMeLight Rev A3 local symbols/);
  assert.match(review, /LOCAL_SYMBOL_READY_FOR_SCHEMATIC_DRAFT/);
  assert.match(review, /Rev A2 remains NOT_FOR_ORDER/);
  assert.match(review, /LP5024RSMR/);
  assert.match(review, /S4-3528RGBTA-A/);
  assert.match(log, /kicad-cli sym upgrade/);
  assert.match(log, /exit code 0/);
});
