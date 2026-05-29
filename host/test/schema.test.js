import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeEvent } from '../src/schema.js';
import { EVENT, STATE } from '../src/states.js';

test('normalizeEvent converts snake_case session_id into internal sessionId', () => {
  const event = normalizeEvent({
    source: 'codex',
    session_id: 'abc123',
    event: 'started',
    state: 'running',
    title: 'Build firmware',
    time: '2026-05-29T00:00:00+08:00',
  });

  assert.deepEqual(event, {
    source: 'codex',
    sessionId: 'abc123',
    event: EVENT.STARTED,
    state: STATE.RUNNING,
    title: 'Build firmware',
    time: '2026-05-29T00:00:00+08:00',
    outcome: undefined,
  });
});

test('normalizeEvent defaults started state to running', () => {
  const event = normalizeEvent({
    source: 'manual',
    session_id: 's1',
    event: 'started',
  });

  assert.equal(event.state, STATE.RUNNING);
});

test('normalizeEvent accepts ended without state', () => {
  const event = normalizeEvent({
    source: 'manual',
    session_id: 's1',
    event: 'ended',
  });

  assert.equal(event.event, EVENT.ENDED);
  assert.equal(event.state, undefined);
});

test('normalizeEvent accepts known ended outcomes', () => {
  for (const outcome of ['success', 'done', 'error']) {
    const event = normalizeEvent({
      source: 'manual',
      session_id: `s-${outcome}`,
      event: 'ended',
      outcome,
    });

    assert.equal(event.outcome, outcome);
  }
});

test('normalizeEvent rejects unknown states', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'started', state: 'paused' }),
    /Unsupported state/
  );
});

test('normalizeEvent rejects explicit null state', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'started', state: null }),
    /Unsupported state/
  );
});

test('normalizeEvent rejects unknown outcomes', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'ended', outcome: 'failed' }),
    /Unsupported outcome/
  );
});

test('normalizeEvent rejects missing session_id', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', event: 'started', state: 'running' }),
    /session_id/
  );
});

test('normalizeEvent rejects unknown events', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'renamed' }),
    /Unsupported event/
  );
});
