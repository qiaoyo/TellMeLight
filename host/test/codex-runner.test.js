import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { runCodexJsonSession } from '../src/codex-runner.js';

test('runCodexJsonSession sends started from the real Codex thread id', async () => {
  const child = createFakeChild();
  const events = [];
  const output = [];

  const promise = runCodexJsonSession({
    args: ['exec', '--json', 'hello'],
    sendEventImpl: async (payload) => events.push(payload),
    spawnImpl: () => {
      queueMicrotask(() => {
        child.stdout.emit('data', '{"type":"thread.started","thread_id":"thread-1"}\n');
        child.stdout.emit('data', '{"type":"turn.completed"}\n');
        child.emit('exit', 0);
      });
      return child;
    },
    stdout: { write: (text) => output.push(text) },
  });

  assert.equal(await promise, 0);
  assert.equal(events[0].event, 'started');
  assert.equal(events[0].session_id, 'thread-1');
  assert.equal(events.at(-1).outcome, 'success');
  assert.match(output.join(''), /thread\.started/);
});

test('runCodexJsonSession maps approval-like JSONL events to approval state', async () => {
  const child = createFakeChild();
  const events = [];

  const exitCode = await runCodexJsonSession({
    args: ['exec', '--json', 'hello'],
    sendEventImpl: async (payload) => events.push(payload),
    spawnImpl: () => {
      queueMicrotask(() => {
        child.stdout.emit('data', '{"type":"thread.started","thread_id":"thread-2"}\n{"type":"item.started","item":{"status":"waiting_for_approval"}}\n');
        child.emit('exit', 0);
      });
      return child;
    },
    stdout: { write() {} },
  });

  assert.equal(exitCode, 0);
  assert.equal(events.some((event) => event.state === 'approval'), true);
});

test('runCodexJsonSession sends one error ended event on non-zero exit', async () => {
  const child = createFakeChild();
  const events = [];

  const exitCode = await runCodexJsonSession({
    args: ['exec', '--json', 'hello'],
    sendEventImpl: async (payload) => events.push(payload),
    spawnImpl: () => {
      queueMicrotask(() => {
        child.stdout.emit('data', '{"type":"thread.started","thread_id":"thread-3"}\n');
        child.emit('exit', 12);
      });
      return child;
    },
    stdout: { write() {} },
  });

  const ended = events.filter((event) => event.event === 'ended');
  assert.equal(exitCode, 12);
  assert.equal(ended.length, 1);
  assert.equal(ended[0].outcome, 'error');
});

test('runCodexJsonSession creates a fallback session if Codex exits before thread.started', async () => {
  const child = createFakeChild();
  const events = [];

  const exitCode = await runCodexJsonSession({
    args: ['exec', '--json', 'hello'],
    sendEventImpl: async (payload) => events.push(payload),
    spawnImpl: () => {
      queueMicrotask(() => child.emit('exit', 1));
      return child;
    },
    stdout: { write() {} },
  });

  assert.equal(exitCode, 1);
  assert.equal(events[0].event, 'started');
  assert.match(events[0].session_id, /^codex-/);
  assert.equal(events[1].outcome, 'error');
});

test('runCodexJsonSession passes command, args, cwd, and env to spawn', async () => {
  const child = createFakeChild();
  let spawnCall;

  const exitCode = await runCodexJsonSession({
    command: 'codex.exe',
    args: ['exec', '--json', 'hello'],
    cwd: 'E:/work',
    env: { A: 'B' },
    sendEventImpl: async () => {},
    spawnImpl: (command, args, options) => {
      spawnCall = { command, args, options };
      queueMicrotask(() => child.emit('exit', 0));
      return child;
    },
    stdout: { write() {} },
  });

  assert.equal(exitCode, 0);
  assert.equal(spawnCall.command, 'codex.exe');
  assert.deepEqual(spawnCall.args, ['exec', '--json', 'hello']);
  assert.equal(spawnCall.options.cwd, 'E:/work');
  assert.equal(spawnCall.options.env.A, 'B');
});

function createFakeChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}
