import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test('rev A3 JLC preflight package combines Rev A2 assembly data with protection parts', async () => {
  const root = 'hardware/outputs/rev_a3/jlc_preflight';
  const manifest = await readJson(`${root}/manifest.json`);
  const readme = await readText(`${root}/README.md`);
  const bom = await readText(`${root}/assembly/rev_a3_jlc_bom_preflight.csv`);
  const cpl = await readText(`${root}/assembly/rev_a3_jlc_cpl_draft.csv`);
  const zip = await stat(`${root}/tellmelight_rev_a3_jlc_assembly_preflight.zip`);

  assert.equal(manifest.project, 'TellMeLight');
  assert.equal(manifest.revision, 'A3');
  assert.equal(manifest.status, 'PREFLIGHT_NOT_FOR_ORDER');
  assert.match(manifest.purpose, /JLC part matching/);
  assert.ok(manifest.blockers.some((blocker) => /Rev A3 PCB\/Gerber\/CPL still pending/.test(blocker)));
  assert.ok(zip.size > 0);

  assert.match(readme, /NOT_FOR_ORDER/);
  assert.match(readme, /do not pay/i);
  assert.match(readme, /Rev A2 Gerber/);
  assert.match(readme, /U6/);

  for (const token of [
    'C2040',
    'C427525',
    'C179173',
    'C165948',
    'C436349',
    'C22935',
    'C57112',
    'C21189',
  ]) {
    assert.match(bom, new RegExp(token));
  }

  assert.match(cpl, /Designator,Mid X,Mid Y,Layer,Rotation,Status,Notes/);
  assert.match(cpl, /U6,41\.000mm,61\.000mm,Bottom,0,DRAFT_ONLY/);
  assert.match(cpl, /R9,76\.000mm,64\.000mm,Bottom,0,DRAFT_ONLY/);
  assert.match(cpl, /C17,80\.000mm,64\.000mm,Bottom,0,DRAFT_ONLY/);
  assert.match(cpl, /R10,53\.500mm,60\.500mm,Bottom,0,DRAFT_ONLY/);
});
