import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('simulator html loads app and stylesheet', async () => {
  const html = await readFile('simulator/index.html', 'utf8');

  assert.match(html, /TellMeLight Simulator/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
});

test('simulator app defines six FIFO slots', async () => {
  const app = await readFile('simulator/app.js', 'utf8');

  assert.match(app, /const SLOT_COUNT = 6/);
  assert.match(app, /session-1/);
  assert.match(app, /session-6/);
});

test('simulator styles preserve four-bar physical language', async () => {
  const css = await readFile('simulator/styles.css', 'utf8');

  assert.match(css, /\.device-face/);
  assert.match(css, /\.bar-left-long/);
  assert.match(css, /\.bar-right-long/);
  assert.match(css, /\.bar-middle-low/);
  assert.match(css, /\.bar-middle-high/);
});
