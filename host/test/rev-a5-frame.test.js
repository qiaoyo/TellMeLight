import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRevA5Frame, serializeRevA5Frame } from '../src/rev-a5-frame.js';

test('buildRevA5Frame maps bridge snapshot slots to six firmware states', () => {
  const frame = buildRevA5Frame({
    revision: 42,
    slots: [
      { slot: 0, state: 'idle' },
      { slot: 1, state: 'running' },
      { slot: 2, state: 'approval' },
      { slot: 3, state: 'done' },
      { slot: 4, state: 'error' },
      { slot: 5, state: 'running' },
    ],
  }, { brightness: 0.12 });

  assert.deepEqual(frame, {
    slots: ['idle', 'running', 'approval', 'done', 'error', 'running'],
    brightness: 0.12,
    revision: 42,
  });
});

test('buildRevA5Frame pads missing slots as idle and clamps brightness', () => {
  const frame = buildRevA5Frame({
    revision: 7,
    slots: [
      { slot: 0, state: 'done' },
      { slot: 1, state: 'unknown' },
    ],
  }, { brightness: 1 });

  assert.deepEqual(frame, {
    slots: ['done', 'idle', 'idle', 'idle', 'idle', 'idle'],
    brightness: 0.18,
    revision: 7,
  });
});

test('serializeRevA5Frame returns one JSON line for the serial sender', () => {
  const line = serializeRevA5Frame({
    slots: ['idle', 'running', 'approval', 'done', 'error', 'running'],
    brightness: 0.1,
    revision: 3,
  });

  assert.equal(line, '{"slots":["idle","running","approval","done","error","running"],"brightness":0.1,"revision":3}\n');
});

