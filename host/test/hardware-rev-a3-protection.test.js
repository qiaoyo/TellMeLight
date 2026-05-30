import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function component(netlist, ref) {
  const item = netlist.components.find((candidate) => candidate.ref === ref);
  assert.ok(item, `${ref} should exist`);
  return item;
}

function pinNet(item, pin) {
  const itemPin = item.pins.find((candidate) => candidate.pin === pin);
  assert.ok(itemPin, `${item.ref}.${pin} should exist`);
  return itemPin.net;
}

function netPins(netlist, name) {
  const net = netlist.nets.find((candidate) => candidate.name === name);
  assert.ok(net, `${name} net should exist`);
  return net.pins;
}

test('rev A3 netlist adds VLED TVS protection and explicit VBUS source link', async () => {
  const netlist = await readJson('hardware/netlists/rev_a3_pin_netlist.json');

  const tvs = component(netlist, 'U6');
  assert.equal(tvs.value, 'TPD1E05U06DPY');
  assert.equal(tvs.symbol, 'Power_Protection:TPD1E05U06DPY');
  assert.equal(tvs.footprint, 'Package_SON:Texas_DPY0002A_0.6x1mm_P0.65mm');
  assert.equal(pinNet(tvs, '1'), 'VLED');
  assert.equal(pinNet(tvs, '2'), 'GND');

  const sourceLink = component(netlist, 'R10');
  assert.equal(sourceLink.value, '0R');
  assert.equal(pinNet(sourceLink, '1'), 'VBUS');
  assert.equal(pinNet(sourceLink, '2'), 'VLED');

  assert.ok(netPins(netlist, 'VLED').includes('U6.1'));
  assert.ok(netPins(netlist, 'VLED').includes('R10.2'));
  assert.ok(netPins(netlist, 'GND').includes('U6.2'));
});

test('rev A3 netlist adds USB-C shell RC shunt to GND', async () => {
  const netlist = await readJson('hardware/netlists/rev_a3_pin_netlist.json');

  const shieldResistor = component(netlist, 'R9');
  const shieldCapacitor = component(netlist, 'C17');
  assert.equal(shieldResistor.value, '1M');
  assert.equal(shieldCapacitor.value, '10nF');
  assert.equal(pinNet(shieldResistor, '1'), 'SHIELD');
  assert.equal(pinNet(shieldResistor, '2'), 'GND');
  assert.equal(pinNet(shieldCapacitor, '1'), 'SHIELD');
  assert.equal(pinNet(shieldCapacitor, '2'), 'GND');

  assert.ok(netPins(netlist, 'SHIELD').includes('J1.S1/S2/S3/S4'));
  assert.ok(netPins(netlist, 'SHIELD').includes('R9.1'));
  assert.ok(netPins(netlist, 'SHIELD').includes('C17.1'));
});

test('rev A3 protection decision note explains ESD, shell RC, and crystal capacitance', async () => {
  const note = await readText('hardware/notes/rev-a3-protection-decisions.md');

  assert.match(note, /VLED TVS/);
  assert.match(note, /TPD1E05U06DPY/);
  assert.match(note, /VBUS.*VLED/);
  assert.match(note, /1M.*10nF/);
  assert.match(note, /C9002/);
  assert.match(note, /20pF/);
  assert.match(note, /33pF/);
});
