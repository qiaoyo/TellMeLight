import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('package exposes host bridge commands', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

  assert.equal(packageJson.scripts.host, 'node host/src/server-cli.js');
  assert.equal(packageJson.scripts.demo, 'node host/src/demo-client.js');
  assert.equal(packageJson.scripts.event, 'node host/src/event-cli.js');
});

test('host bridge CLI starts the HTTP server on the default port', async () => {
  const cli = await readFile('host/src/server-cli.js', 'utf8');

  assert.match(cli, /createHostBridgeServer/);
  assert.match(cli, /TELLMELIGHT_PORT/);
  assert.match(cli, /8787/);
  assert.match(cli, /127\.0\.0\.1/);
});

test('demo client posts a repeatable event sequence', async () => {
  const demo = await readFile('host/src/demo-client.js', 'utf8');

  assert.match(demo, /export const DEMO_EVENTS/);
  assert.match(demo, /TELLMELIGHT_URL/);
  assert.match(demo, /\/v1\/events/);
  assert.match(demo, /demo-a/);
  assert.match(demo, /demo-b/);
});

test('event CLI sends adapter events through the event client', async () => {
  const cli = await readFile('host/src/event-cli.js', 'utf8');

  assert.match(cli, /parseEventCliArgs/);
  assert.match(cli, /sendEvent/);
  assert.match(cli, /started/);
  assert.match(cli, /approval/);
  assert.match(cli, /cleared/);
});
