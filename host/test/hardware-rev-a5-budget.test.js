import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(',');
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    });
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('rev A5 buy-now cart stays under RMB 300 hard stop', async () => {
  const rows = parseCsv(await readText('hardware/bom/rev_a5_budget_evt_bom.csv'));
  const buyNowTotal = rows
    .filter((row) => row.BuyNow === 'YES')
    .reduce((sum, row) => sum + Number(row.ExtendedRmb), 0);

  assert.equal(buyNowTotal, 235);
  assert.ok(buyNowTotal <= 300);
  assert.ok(rows.some((row) => row.Item.includes('JLC Rev A4') && row.BuyNow === 'NO'));
});

test('rev A5 budget guard reports the guarded total', async () => {
  const result = await runNode(['tools/hardware/check-rev-a5-budget.mjs']);

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Rev A5 buy-now total: RMB 235\.00/);
  assert.match(result.stdout, /Hard stop threshold: RMB 300\.00/);
});

test('rev A5 guide bans first-version JLC PCBA and documents module path', async () => {
  const guide = await readText('hardware/notes/rev-a5-budget-evt.md');
  const checklist = await readText('hardware/notes/rev-a5-order-checklist.md');
  const spec = await readText('docs/superpowers/specs/2026-06-02-rev-a5-budget-evt-design.md');

  for (const text of [guide, checklist, spec]) {
    assert.match(text, /RMB 300/);
    assert.match(text, /XIAO RP2040/);
    assert.match(text, /6x10 RGB WS2812 Matrix/);
  }

  assert.match(guide, /Do not buy the Rev A4/);
  assert.match(checklist, /Do Not Buy/);
  assert.match(spec, /No Rev A5 JLC PCBA order/);
});

test('rev A5 firmware supports six persistent session states over serial', async () => {
  const firmware = await readText('firmware/rev_a5_budget_evt/code.py');
  const sender = await readText('tools/rev_a5/send-serial-state.ps1');

  for (const token of ['running', 'approval', 'done', 'error', 'cleared', 'idle']) {
    assert.match(firmware, new RegExp(`"${token}"`));
  }

  assert.match(firmware, /PIXEL_COUNT = 60/);
  assert.match(firmware, /MAX_BRIGHTNESS = 0\.18/);
  assert.match(firmware, /supervisor\.runtime\.serial_bytes_available/);
  assert.match(firmware, /neopixel_write\.neopixel_write/);
  assert.match(sender, /System\.IO\.Ports\.SerialPort/);
  assert.match(sender, /ConvertTo-Json -Compress/);
});

