import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCodexEventToTellMeLight, createCodexEventContext } from '../src/codex-event-mapper.js';

test('thread.started creates a running TellMeLight session keyed by Codex thread id', () => {
  const context = createCodexEventContext({ title: 'Codex smoke' });
  const payload = mapCodexEventToTellMeLight({ type: 'thread.started', thread_id: 'thread-1' }, context);

  assert.deepEqual(payload, {
    source: 'codex',
    session_id: 'thread-1',
    event: 'started',
    state: 'running',
    title: 'Codex smoke',
  });
  assert.equal(context.sessionId, 'thread-1');
});

test('turn.started maps to running when the Codex thread is known', () => {
  const context = createCodexEventContext({ sessionId: 'thread-1' });
  const payload = mapCodexEventToTellMeLight({ type: 'turn.started' }, context);

  assert.deepEqual(payload, {
    source: 'codex',
    session_id: 'thread-1',
    event: 'state_changed',
    state: 'running',
  });
});

test('approval-like Codex items map to approval state', () => {
  const context = createCodexEventContext({ sessionId: 'thread-1' });
  const payload = mapCodexEventToTellMeLight(
    {
      type: 'item.started',
      item: {
        type: 'command_execution',
        status: 'waiting_for_approval',
      },
    },
    context,
  );

  assert.deepEqual(payload, {
    source: 'codex',
    session_id: 'thread-1',
    event: 'state_changed',
    state: 'approval',
  });
});

test('turn.completed maps to successful ended event', () => {
  const context = createCodexEventContext({ sessionId: 'thread-1', title: 'Codex smoke' });
  const payload = mapCodexEventToTellMeLight({ type: 'turn.completed' }, context);

  assert.deepEqual(payload, {
    source: 'codex',
    session_id: 'thread-1',
    event: 'ended',
    outcome: 'success',
    title: 'Codex smoke',
  });
  assert.equal(context.ended, true);
});

test('error-like Codex events map to errored ended event', () => {
  const context = createCodexEventContext({ sessionId: 'thread-1' });
  const payload = mapCodexEventToTellMeLight({ type: 'turn.failed' }, context);

  assert.deepEqual(payload, {
    source: 'codex',
    session_id: 'thread-1',
    event: 'ended',
    outcome: 'error',
  });
  assert.equal(context.ended, true);
});

test('events before a known thread id do not emit TellMeLight payloads', () => {
  const context = createCodexEventContext();

  assert.equal(mapCodexEventToTellMeLight({ type: 'turn.started' }, context), null);
});
