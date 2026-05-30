import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProcessCliArgs } from '../src/process-cli.js';

test('parseProcessCliArgs parses wrapper flags before the separator', () => {
  const parsed = parseProcessCliArgs([
    '--source',
    'codex',
    '--id',
    's1',
    '--title',
    'Build',
    '--url',
    'http://127.0.0.1:9000',
    '--',
    'echo',
    'ok',
  ]);

  assert.equal(parsed.source, 'codex');
  assert.equal(parsed.sessionId, 's1');
  assert.equal(parsed.title, 'Build');
  assert.equal(parsed.baseUrl, 'http://127.0.0.1:9000');
  assert.equal(parsed.command, 'echo');
  assert.deepEqual(parsed.args, ['ok']);
});

test('parseProcessCliArgs uses process as the default source', () => {
  const parsed = parseProcessCliArgs(['--id', 's1', '--', 'echo', 'ok']);

  assert.equal(parsed.source, 'process');
});

test('parseProcessCliArgs generates a session id when omitted', () => {
  const parsed = parseProcessCliArgs(['--source', 'codex', '--', 'echo'], {
    idFactory: ({ source }) => `${source}-generated`,
  });

  assert.equal(parsed.sessionId, 'codex-generated');
});

test('parseProcessCliArgs uses the command as the default title', () => {
  const parsed = parseProcessCliArgs(['--id', 's1', '--', 'echo', 'ok']);

  assert.equal(parsed.title, 'echo ok');
});

test('parseProcessCliArgs throws when separator is missing', () => {
  assert.throws(() => parseProcessCliArgs(['--id', 's1', 'echo']), /-- separator is required/);
});

test('parseProcessCliArgs throws when no command follows the separator', () => {
  assert.throws(() => parseProcessCliArgs(['--id', 's1', '--']), /command is required/);
});
