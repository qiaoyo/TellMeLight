import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function pinsByRef(netlist, ref) {
  const component = netlist.components.find((item) => item.ref === ref);
  assert.ok(component, `${ref} should exist`);
  return new Map(component.pins.map((pin) => [pin.pin, pin]));
}

function hasNetPin(netlist, netName, refPin) {
  const net = netlist.nets.find((item) => item.name === netName);
  assert.ok(net, `${netName} net should exist`);
  assert.ok(net.pins.includes(refPin), `${netName} should include ${refPin}`);
}

test('rev A3 pin netlist captures the full six-session RGB channel map', async () => {
  const netlist = await readJson('hardware/netlists/rev_a3_pin_netlist.json');

  assert.equal(netlist.metadata.revision, 'A3');
  assert.equal(netlist.metadata.status, 'PIN_LEVEL_NETLIST_READY_FOR_SCHEMATIC_DRAFT');

  const u2 = pinsByRef(netlist, 'U2');
  assert.equal(u2.get('1').net, 'D1_R');
  assert.equal(u2.get('2').net, 'D1_G');
  assert.equal(u2.get('3').net, 'D1_B');
  assert.equal(u2.get('16').net, 'D6_R');
  assert.equal(u2.get('17').net, 'D6_G');
  assert.equal(u2.get('18').net, 'D6_B');

  for (const [ref, red, green, blue] of [
    ['D1', 'D1_R', 'D1_G', 'D1_B'],
    ['D2', 'D2_R', 'D2_G', 'D2_B'],
    ['D3', 'D3_R', 'D3_G', 'D3_B'],
    ['D4', 'D4_R', 'D4_G', 'D4_B'],
    ['D5', 'D5_R', 'D5_G', 'D5_B'],
    ['D6', 'D6_R', 'D6_G', 'D6_B'],
  ]) {
    const led = pinsByRef(netlist, ref);
    assert.equal(led.get('1').net, blue);
    assert.equal(led.get('2').net, 'VLED');
    assert.equal(led.get('3').net, green);
    assert.equal(led.get('4').net, red);
  }
});

test('rev A3 pin netlist records USB, flash, power, and service nets', async () => {
  const netlist = await readJson('hardware/netlists/rev_a3_pin_netlist.json');

  for (const ref of ['U1', 'U2', 'U3', 'U4', 'U5', 'J1', 'Y1', 'SW1', 'SW2']) {
    assert.ok(netlist.components.some((component) => component.ref === ref), `${ref} should exist`);
  }

  hasNetPin(netlist, 'USB_DP_MCU', 'U1.47');
  hasNetPin(netlist, 'USB_DP_MCU', 'R1.2');
  hasNetPin(netlist, 'USB_DP_CONN', 'R1.1');
  hasNetPin(netlist, 'USB_DP_CONN', 'U5.1');
  hasNetPin(netlist, 'USB_DM_MCU', 'U1.46');
  hasNetPin(netlist, 'FLASH_CS_N_BOOTSEL', 'U1.56');
  hasNetPin(netlist, 'FLASH_CS_N_BOOTSEL', 'U3.1');
  hasNetPin(netlist, 'FLASH_CS_N_BOOTSEL', 'SW1.1');
  hasNetPin(netlist, 'RUN_RESET', 'U1.26');
  hasNetPin(netlist, 'RUN_RESET', 'SW2.1');
  hasNetPin(netlist, 'LP_IREF', 'U2.31');
  hasNetPin(netlist, 'LP_VCAP', 'U2.32');
});

test('rev A3 feasibility note identifies reusable stock symbols and local symbol work', async () => {
  const netlist = await readJson('hardware/netlists/rev_a3_pin_netlist.json');
  const csv = await readText('hardware/netlists/rev_a3_pin_netlist.csv');
  const note = await readText('hardware/notes/rev-a3-pin-level-schematic-feasibility.md');

  assert.match(csv, /Reference,Value,Pin,Pin Name,Net,Status,Notes/);
  assert.ok(netlist.symbolReadiness.some((item) => item.symbol === 'MCU_RaspberryPi:RP2040' && item.status === 'STOCK_SYMBOL_OK'));
  assert.ok(netlist.symbolReadiness.some((item) => item.symbol === 'TellMeLight_Rev_A3:LP5024RSMR' && item.status === 'LOCAL_SYMBOL_REQUIRED'));
  assert.ok(netlist.symbolReadiness.some((item) => item.symbol === 'TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A' && item.status === 'LOCAL_SYMBOL_REQUIRED'));

  assert.match(note, /Stock KiCad Symbols Available/);
  assert.match(note, /Local Symbols Required/);
  assert.match(note, /LP5024RSMR/);
  assert.match(note, /S4-3528RGBTA-A/);
  assert.match(note, /Rev A2 remains NOT_FOR_ORDER/);
});
