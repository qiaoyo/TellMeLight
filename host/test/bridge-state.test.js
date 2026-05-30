import assert from 'node:assert/strict';
import test from 'node:test';
import { createBridge } from '../src/bridge-state.js';

test('bridge snapshot exposes six idle slots', () => {
  const bridge = createBridge();

  assert.equal(bridge.snapshot().revision, 0);
  assert.deepEqual(
    bridge.snapshot().slots.map((slot) => slot.state),
    ['idle', 'idle', 'idle', 'idle', 'idle', 'idle'],
  );
  assert.deepEqual(
    bridge.snapshot().slots.map((slot) => slot.id),
    [null, null, null, null, null, null],
  );
});

test('bridge applies normalized event payloads through the FIFO core', () => {
  const bridge = createBridge();

  const snapshot = bridge.applyEventPayload({
    source: 'manual',
    session_id: 's1',
    event: 'started',
    title: 'First local session',
  });

  assert.equal(snapshot.revision, 1);
  assert.equal(snapshot.slots[5].id, 's1');
  assert.equal(snapshot.slots[5].source, 'manual');
  assert.equal(snapshot.slots[5].state, 'running');
  assert.equal(snapshot.slots[5].title, 'First local session');
});

test('bridge notifies subscribers immediately and after changes', () => {
  const bridge = createBridge();
  const revisions = [];

  const unsubscribe = bridge.subscribe((snapshot) => {
    revisions.push(snapshot.revision);
  });
  bridge.applyEventPayload({ source: 'manual', session_id: 's1', event: 'started' });
  unsubscribe();
  bridge.applyEventPayload({ source: 'manual', session_id: 's2', event: 'started' });

  assert.deepEqual(revisions, [0, 1]);
});
