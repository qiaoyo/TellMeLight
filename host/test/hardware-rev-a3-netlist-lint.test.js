import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test('rev A3 netlist lint finds no unexpected single-pin nets', async () => {
  const report = await readJson('hardware/outputs/rev_a3/netlist-lint.json');

  assert.equal(report.status, 'PASS_WITH_REVIEW_ITEMS');
  assert.deepEqual(report.unexpectedSinglePinNets, []);
  assert.ok(report.reviewSinglePinNets.some((item) => item.name === 'GPIO0_RESERVED'));
  assert.ok(report.reviewSinglePinNets.some((item) => item.name === 'GPIO1_RESERVED_LP_EN_OPTION'));
  assert.ok(report.reviewSinglePinNets.some((item) => item.name === 'RP2040_VREG_OUT'));
  assert.ok(report.reviewSinglePinNets.some((item) => item.name === 'SHIELD'));
});

test('rev A3 netlist lint keeps required nets and VLED source review visible', async () => {
  const report = await readJson('hardware/outputs/rev_a3/netlist-lint.json');

  for (const netName of [
    'GND',
    '3V3',
    'VBUS',
    'VLED',
    'I2C0_SDA',
    'I2C0_SCL',
    'USB_DP_MCU',
    'USB_DP_CONN',
    'USB_DM_MCU',
    'USB_DM_CONN',
    'FLASH_CS_N_BOOTSEL',
    'RUN_RESET',
    'LP_IREF',
    'LP_VCAP',
  ]) {
    const net = report.requiredNets.find((item) => item.name === netName);
    assert.ok(net, `${netName} should be reported`);
    assert.ok(net.pinCount >= 2, `${netName} should have at least two pins`);
  }

  assert.ok(report.reviewFindings.some((item) => item.code === 'VLED_SOURCE_MODEL'));
  assert.ok(report.reviewFindings.some((item) => item.code === 'JLC_ORIENTATION_PREVIEW_OUT_OF_SCOPE'));
});

test('rev A3 netlist lint markdown explains review boundaries', async () => {
  const note = await readText('hardware/notes/rev-a3-netlist-lint.md');

  assert.match(note, /No unexpected single-pin nets/);
  assert.match(note, /Review single-pin nets/);
  assert.match(note, /VLED source model/);
  assert.match(note, /JLC orientation preview remains outside this lint/);
  assert.match(note, /Rev A2 remains NOT_FOR_ORDER/);
});
