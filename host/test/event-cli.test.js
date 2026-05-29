import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEventCliArgs } from '../src/event-cli.js';

test('started command maps to a started running payload', () => {
  const parsed = parseEventCliArgs(['started', '--id', 's1', '--source', 'codex', '--title', 'Build']);

  assert.equal(parsed.baseUrl, undefined);
  assert.deepEqual(parsed.payload, {
    source: 'codex',
    session_id: 's1',
    event: 'started',
    state: 'running',
    title: 'Build',
  });
});

test('approval command maps to a state_changed payload', () => {
  const parsed = parseEventCliArgs(['approval', '--id', 's1']);

  assert.deepEqual(parsed.payload, {
    source: 'manual',
    session_id: 's1',
    event: 'state_changed',
    state: 'approval',
  });
});

test('done command maps to a successful ended payload', () => {
  const parsed = parseEventCliArgs(['done', '--id', 's1']);

  assert.deepEqual(parsed.payload, {
    source: 'manual',
    session_id: 's1',
    event: 'ended',
    outcome: 'success',
  });
});

test('error command maps to an errored ended payload', () => {
  const parsed = parseEventCliArgs(['error', '--id', 's1']);

  assert.deepEqual(parsed.payload, {
    source: 'manual',
    session_id: 's1',
    event: 'ended',
    outcome: 'error',
  });
});

test('cleared command maps to a cleared payload with URL override', () => {
  const parsed = parseEventCliArgs(['cleared', '--id', 's1', '--url', 'http://127.0.0.1:9000']);

  assert.equal(parsed.baseUrl, 'http://127.0.0.1:9000');
  assert.deepEqual(parsed.payload, {
    source: 'manual',
    session_id: 's1',
    event: 'cleared',
  });
});

test('missing id throws a readable error', () => {
  assert.throws(() => parseEventCliArgs(['started']), /--id is required/);
});
