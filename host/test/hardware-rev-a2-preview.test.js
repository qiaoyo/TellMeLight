import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('rev A2 preview page links renders, JLC bundle, and Rev A3 readiness work', async () => {
  const preview = await readFile('hardware/outputs/rev_a2/preview.html', 'utf8');

  for (const token of [
    'TellMeLight Rev A2 Hardware Preview',
    'NOT_FOR_ORDER',
    'tellmelight_rev_a2_top.png',
    'tellmelight_rev_a2_bottom.png',
    'jlc_upload/tellmelight_rev_a2_jlc_gerber_drill.zip',
    'jlc_upload/tellmelight_rev_a2_jlc_assembly_bom_cpl.zip',
    'jlc_upload/manifest.json',
    '../../netlists/rev_a3_pin_netlist.json',
    '../rev_a3/netlist-lint.json',
    '../../notes/rev-a3-jlc-tonight-checklist.md',
    '../../notes/rev-a3-protection-decisions.md',
    'VLED source model resolved',
    'USB-C shell RC',
    'JLC orientation preview',
  ]) {
    assert.match(preview, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
