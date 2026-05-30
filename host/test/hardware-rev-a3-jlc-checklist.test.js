import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

test('rev A3 JLC tonight checklist gives concrete upload and no-payment instructions', async () => {
  const note = await readText('hardware/notes/rev-a3-jlc-tonight-checklist.md');

  for (const token of [
    'Tonight goal',
    'Do not pay',
    'hardware/outputs/rev_a2/jlc_upload/tellmelight_rev_a2_jlc_gerber_drill.zip',
    'hardware/outputs/rev_a2/jlc_upload/tellmelight_rev_a2_jlc_assembly_bom_cpl.zip',
    'hardware/bom/rev_a3_protection_bom_delta.csv',
    'VLED TVS',
    'USB-C shell RC',
    'C9002',
    '33pF',
    'JLC orientation preview',
  ]) {
    assert.match(note, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('rev A3 protection BOM delta lists new JLC candidates', async () => {
  const bom = await readText('hardware/bom/rev_a3_protection_bom_delta.csv');

  assert.match(bom, /Designator,Qty,Value,Function,Footprint,JLC Candidate,Status,Notes/);
  assert.match(bom, /U6,1,TPD1E05U06DPY,VLED TVS/);
  assert.match(bom, /R9,1,1M,USB-C shell bleed/);
  assert.match(bom, /C17,1,10nF,USB-C shell RF shunt/);
  assert.match(bom, /R10,1,0R,VBUS-to-VLED source link/);
  assert.match(bom, /C436349/);
  assert.match(bom, /C22935/);
  assert.match(bom, /C57112/);
  assert.match(bom, /C21189/);
});
