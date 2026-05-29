import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyModel, applyEvent } from '../src/fifo.js';
import { STATE } from '../src/states.js';

function ids(model) {
  return model.slots.map((slot) => slot?.sessionId ?? null);
}

function states(model) {
  return model.slots.map((slot) => slot?.state ?? STATE.IDLE);
}

test('started inserts newest session into slot 6 and shifts older sessions left', () => {
  let model = createEmptyModel();

  for (const sessionId of ['s1', 's2', 's3']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  assert.deepEqual(ids(model), [null, null, null, 's1', 's2', 's3']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.RUNNING, STATE.RUNNING, STATE.RUNNING]);
});

test('seventh started event evicts slot 1 and appends newest session', () => {
  let model = createEmptyModel();

  for (const sessionId of ['s1', 's2', 's3', 's4', 's5', 's6', 's7']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  assert.deepEqual(ids(model), ['s2', 's3', 's4', 's5', 's6', 's7']);
  assert.equal(model.history.at(-1).type, 'evicted');
  assert.equal(model.history.at(-1).sessionId, 's1');
});

test('state_changed updates an existing session in place', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'state_changed', state: STATE.APPROVAL });

  assert.deepEqual(ids(model), [null, null, null, null, null, 's1']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.APPROVAL]);
});

test('state_changed for unknown session creates a new visible session', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 'late', event: 'state_changed', state: STATE.APPROVAL });

  assert.deepEqual(ids(model), [null, null, null, null, null, 'late']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.APPROVAL]);
});

test('history records resolved states for defaulted events', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started' });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended' });
  model = applyEvent(model, { source: 'test', sessionId: 's2', event: 'ended', outcome: 'error' });

  assert.equal(model.history[0].state, STATE.RUNNING);
  assert.equal(model.history[1].state, STATE.DONE);
  assert.equal(model.history[2].state, STATE.ERROR);
});

test('ended keeps session visible and maps default outcome to done', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended' });

  assert.deepEqual(ids(model), [null, null, null, null, null, 's1']);
  assert.equal(model.slots[5].state, STATE.DONE);
});

test('ended success outcomes keep session visible as done', () => {
  for (const outcome of ['success', 'done']) {
    let model = createEmptyModel();
    model = applyEvent(model, { source: 'test', sessionId: outcome, event: 'started', state: STATE.RUNNING });
    model = applyEvent(model, { source: 'test', sessionId: outcome, event: 'ended', outcome });

    assert.equal(model.slots[5].state, STATE.DONE);
  }
});

test('ended with error outcome keeps session visible as error', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended', outcome: 'error' });

  assert.equal(model.slots[5].state, STATE.ERROR);
});

test('ended rejects unsupported outcomes', () => {
  const model = applyEvent(createEmptyModel(), {
    source: 'test',
    sessionId: 's1',
    event: 'started',
    state: STATE.RUNNING,
  });

  assert.throws(
    () => applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended', outcome: 'failed' }),
    /Unsupported outcome/
  );
});

test('cleared removes a session and compacts remaining sessions left', () => {
  let model = createEmptyModel();
  for (const sessionId of ['s1', 's2', 's3', 's4']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  model = applyEvent(model, { source: 'test', sessionId: 's2', event: 'cleared' });

  assert.deepEqual(ids(model), [null, null, 's1', 's3', 's4', null]);
});

test('applyEvent does not mutate the previous model', () => {
  const model = applyEvent(createEmptyModel(), {
    source: 'test',
    sessionId: 's1',
    event: 'started',
    state: STATE.RUNNING,
  });
  const previousSlots = model.slots;
  const previousSlot = model.slots[5];
  const previousHistory = model.history;
  const previousRevision = model.revision;

  const next = applyEvent(model, {
    source: 'test',
    sessionId: 's1',
    event: 'state_changed',
    state: STATE.APPROVAL,
  });

  assert.notEqual(next, model);
  assert.equal(model.slots, previousSlots);
  assert.equal(model.slots[5], previousSlot);
  assert.equal(model.history, previousHistory);
  assert.equal(model.revision, previousRevision);
  assert.equal(model.slots[5].state, STATE.RUNNING);
  assert.equal(model.history.length, 1);
  assert.equal(next.slots[5].state, STATE.APPROVAL);
  assert.equal(next.history.length, 2);
});
