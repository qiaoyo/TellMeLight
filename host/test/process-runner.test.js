import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { runProcessWithEvents } from '../src/process-runner.js';

test('runProcessWithEvents sends started before spawning the child process', async () => {
  const order = [];
  const child = createFakeChild();

  const promise = runProcessWithEvents({
    command: 'echo',
    args: ['ok'],
    sessionId: 'p1',
    source: 'test',
    title: 'Process 1',
    sendEventImpl: async (payload) => {
      order.push(`event:${payload.event}`);
    },
    spawnImpl: () => {
      order.push('spawn');
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    },
  });

  assert.equal(await promise, 0);
  assert.deepEqual(order, ['event:started', 'spawn', 'event:ended']);
});

test('runProcessWithEvents maps exit code 0 to success outcome', async () => {
  const events = [];
  const child = createFakeChild();

  const exitCode = await runProcessWithEvents({
    command: 'tool',
    args: [],
    sessionId: 'p2',
    source: 'test',
    sendEventImpl: async (payload) => {
      events.push(payload);
    },
    spawnImpl: () => {
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(events.at(-1).event, 'ended');
  assert.equal(events.at(-1).outcome, 'success');
});

test('runProcessWithEvents maps non-zero exit code to error outcome', async () => {
  const events = [];
  const child = createFakeChild();

  const exitCode = await runProcessWithEvents({
    command: 'tool',
    args: [],
    sessionId: 'p3',
    source: 'test',
    sendEventImpl: async (payload) => {
      events.push(payload);
    },
    spawnImpl: () => {
      queueMicrotask(() => child.emit('exit', 7));
      return child;
    },
  });

  assert.equal(exitCode, 7);
  assert.equal(events.at(-1).event, 'ended');
  assert.equal(events.at(-1).outcome, 'error');
});

test('runProcessWithEvents continues when TellMeLight event sending fails', async () => {
  const child = createFakeChild();
  let spawnCalled = false;

  const exitCode = await runProcessWithEvents({
    command: 'tool',
    args: [],
    sessionId: 'p4',
    source: 'test',
    sendEventImpl: async (payload) => {
      if (payload.event === 'started') {
        throw new Error('bridge down');
      }
    },
    spawnImpl: () => {
      spawnCalled = true;
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    },
    warningStream: { write() {} },
  });

  assert.equal(spawnCalled, true);
  assert.equal(exitCode, 0);
});

function createFakeChild() {
  const child = new EventEmitter();
  child.stdout = null;
  child.stderr = null;
  return child;
}
