import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('rev A5 preview page exposes budget, module architecture, and optical stack', async () => {
  const html = await readFile('hardware/outputs/rev_a5_budget/preview.html', 'utf8');

  for (const token of [
    'TellMeLight Rev A5 Budget EVT',
    'RMB 235',
    'RMB 300 hard stop',
    'XIAO RP2040',
    '6x10 WS2812 Matrix',
    'Frosted diffuser',
    'Black mask',
    'No JLC PCBA',
  ]) {
    assert.match(html, new RegExp(token));
  }
});

test('rev A5 preview links the actionable guide files', async () => {
  const html = await readFile('hardware/outputs/rev_a5_budget/preview.html', 'utf8');

  assert.match(html, /hardware\/notes\/rev-a5-budget-evt\.md/);
  assert.match(html, /hardware\/notes\/rev-a5-order-checklist\.md/);
  assert.match(html, /firmware\/rev_a5_budget_evt\/code\.py/);
  assert.match(html, /tools\/rev_a5\/send-serial-state\.ps1/);
});

