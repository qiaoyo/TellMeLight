import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCodexChildEnv, parseCodexCliArgs } from '../src/codex-cli.js';

test('parseCodexCliArgs maps exec to codex exec json mode', () => {
  const parsed = parseCodexCliArgs(['exec', '-C', '.', '--sandbox', 'read-only', 'hello']);

  assert.equal(parsed.command, 'codex');
  assert.deepEqual(parsed.args, ['exec', '--json', '-C', '.', '--sandbox', 'read-only', 'hello']);
  assert.equal(parsed.source, 'codex');
  assert.equal(parsed.title, 'Codex exec');
});

test('parseCodexCliArgs defaults to codex exec when no subcommand is provided', () => {
  const parsed = parseCodexCliArgs(['hello']);

  assert.deepEqual(parsed.args, ['exec', '--json', 'hello']);
});

test('parseCodexCliArgs maps resume to codex exec resume json mode', () => {
  const parsed = parseCodexCliArgs(['resume', '--last', 'continue']);

  assert.deepEqual(parsed.args, ['exec', 'resume', '--json', '--last', 'continue']);
  assert.equal(parsed.title, 'Codex resume');
});

test('parseCodexCliArgs parses TellMeLight-only flags without passing them to Codex', () => {
  const parsed = parseCodexCliArgs([
    '--tml-url',
    'http://127.0.0.1:9000',
    '--tml-title',
    'PCB helper',
    '--tml-proxy',
    'http://127.0.0.1:7892',
    'exec',
    'hello',
  ]);

  assert.equal(parsed.baseUrl, 'http://127.0.0.1:9000');
  assert.equal(parsed.title, 'PCB helper');
  assert.equal(parsed.proxy, 'http://127.0.0.1:7892');
  assert.deepEqual(parsed.args, ['exec', '--json', 'hello']);
});

test('parseCodexCliArgs does not duplicate an explicit json flag', () => {
  const parsed = parseCodexCliArgs(['exec', '--json', 'hello']);

  assert.deepEqual(parsed.args, ['exec', '--json', 'hello']);
});

test('buildCodexChildEnv applies a proxy to all common proxy variable spellings', () => {
  const env = buildCodexChildEnv({ Path: 'x', HTTPS_PROXY: 'old' }, 'http://127.0.0.1:7892');

  assert.equal(env.Path, 'x');
  assert.equal(env.HTTP_PROXY, 'http://127.0.0.1:7892');
  assert.equal(env.HTTPS_PROXY, 'http://127.0.0.1:7892');
  assert.equal(env.http_proxy, 'http://127.0.0.1:7892');
  assert.equal(env.https_proxy, 'http://127.0.0.1:7892');
});
