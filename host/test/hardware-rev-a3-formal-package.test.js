import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test('rev A3 KiCad project places protection parts on a smaller watermarked board', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_pcb');
  const readme = await readText('hardware/kicad/tellmelight_rev_a3/README.md');

  assert.match(readme, /76 mm x 56 mm/);
  assert.match(readme, /avatar watermark/);
  assert.match(pcb, /TellMeLight Rev A3/);
  assert.match(pcb, /Avatar watermark/);
  assert.match(pcb, /TPD1E05U06DPY/);
  assert.match(pcb, /Texas_DPY0002A_0\.6x1mm_P0\.65mm/);

  for (const ref of ['U6', 'R9', 'C17', 'R10']) {
    assert.match(pcb, new RegExp(`\\(property "Reference" "${ref}"`));
  }

  for (const coord of [
    /\(end 74 0\)/,
    /\(end 76 2\)/,
    /\(end 76 54\)/,
    /\(end 74 56\)/,
  ]) {
    assert.match(pcb, coord);
  }
});

test('rev A3 JLC BOM and CPL include protection additions without draft-only flags', async () => {
  const bom = await readText('hardware/bom/rev_a3_jlc_bom.csv');
  const cpl = await readText('hardware/bom/rev_a3_jlc_cpl.csv');
  const designBom = await readText('hardware/bom/rev_a3_bom.csv');

  assert.match(bom, /^Comment,Designator,Footprint,LCSC Part/m);
  assert.doesNotMatch(bom, /^Designator,/m);
  assert.match(cpl, /^Designator,Mid X,Mid Y,Layer,Rotation/m);
  assert.doesNotMatch(cpl, /DRAFT_ONLY/);

  for (const token of [
    'C436349',
    'C22935',
    'C57112',
    'C21189',
    'TPD1E05U06DPY',
    'USB-C shell RF shunt',
    'avatar watermark',
  ]) {
    assert.match(`${bom}\n${cpl}\n${designBom}`, new RegExp(token));
  }
});

test('rev A3 JLC upload package provides gerber and assembly zips with review gates', async () => {
  const root = 'hardware/outputs/rev_a3/jlc_upload';
  const manifest = await readJson(`${root}/manifest.json`);
  const readme = await readText(`${root}/README.md`);
  const verification = await readText('hardware/outputs/rev_a3/verification-summary.md');
  const gerberZip = await stat(`${root}/tellmelight_rev_a3_jlc_gerber_drill.zip`);
  const assemblyZip = await stat(`${root}/tellmelight_rev_a3_jlc_assembly_bom_cpl.zip`);

  assert.equal(manifest.project, 'TellMeLight');
  assert.equal(manifest.revision, 'A3');
  assert.equal(manifest.status, 'ORDER_REVIEW_NOT_FOR_PAYMENT');
  assert.ok(manifest.files.some((file) => file.path === 'assembly/rev_a3_jlc_bom.csv'));
  assert.ok(manifest.files.some((file) => file.path === 'assembly/rev_a3_jlc_cpl.csv'));
  assert.ok(manifest.files.some((file) => file.path === 'gerber_drill/tellmelight_rev_a3-F_Cu.gtl'));
  assert.ok(gerberZip.size > 0);
  assert.ok(assemblyZip.size > 0);

  assert.match(readme, /do not pay/i);
  assert.match(readme, /orientation preview/i);
  assert.match(readme, /76 mm x 56 mm/);
  assert.match(verification, /ERC: 0 violations/);
  assert.match(verification, /DRC: 0 violations/);
  assert.match(verification, /U6\/R9\/C17\/R10/);
});
