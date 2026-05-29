import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeDisplayFrame } from '../src/hid-frame.js';
import { STATE } from '../src/states.js';

test('encodeDisplayFrame returns a 64-byte frame with TellMeLight magic', () => {
  const frame = encodeDisplayFrame({
    seq: 7,
    brightness: 128,
    slots: [{ sessionId: 'a', state: STATE.RUNNING }],
  });

  assert.equal(frame.length, 64);
  assert.equal(String.fromCharCode(frame[0], frame[1]), 'TL');
  assert.equal(frame[2], 1);
  assert.equal(frame[3], 7);
  assert.equal(frame[4], 128);
});

test('encodeDisplayFrame supports default options', () => {
  const frame = encodeDisplayFrame();

  assert.equal(frame.length, 64);
  assert.equal(String.fromCharCode(frame[0], frame[1]), 'TL');
});

test('encodeDisplayFrame encodes slot state and animation intent', () => {
  const frame = encodeDisplayFrame({
    seq: 1,
    brightness: 255,
    slots: [
      { sessionId: 'a', state: STATE.RUNNING },
      { sessionId: 'b', state: STATE.APPROVAL },
      { sessionId: 'c', state: STATE.DONE },
      { sessionId: 'd', state: STATE.ERROR },
      null,
      null,
    ],
  });

  assert.equal(frame[8], 1);
  assert.equal(frame[9], 2);
  assert.equal(frame[16], 2);
  assert.equal(frame[17], 3);
  assert.equal(frame[24], 3);
  assert.equal(frame[25], 1);
  assert.equal(frame[32], 4);
  assert.equal(frame[33], 4);
  assert.equal(frame[40], 0);
  assert.equal(frame[48], 0);
});

test('encodeDisplayFrame zeroes every byte for empty slots', () => {
  const frame = encodeDisplayFrame({ slots: [null] });

  assert.deepEqual(Array.from(frame.subarray(8, 16)), [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(Array.from(frame.subarray(16, 24)), [0, 0, 0, 0, 0, 0, 0, 0]);
});

test('encodeDisplayFrame renders unknown slot states as idle without overrides', () => {
  const frame = encodeDisplayFrame({
    slots: [{ sessionId: 'mystery', state: 'mystery', anim: 'pulse', intensity: 255 }],
  });

  assert.equal(frame[8], 0);
  assert.equal(frame[9], 0);
  assert.equal(frame[10], 0);
});

test('encodeDisplayFrame uses stable little-endian bytes for a labeled slot vector', () => {
  const frame = encodeDisplayFrame({
    seq: 0x12,
    brightness: 0x34,
    flags: 0x56,
    slots: [{ sessionId: 'session-a', state: STATE.RUNNING }],
  });

  assert.deepEqual(Array.from(frame.subarray(0, 8)), [0x54, 0x4c, 0x01, 0x12, 0x34, 0x56, 0x00, 0x00]);
  assert.deepEqual(Array.from(frame.subarray(8, 16)), [0x01, 0x02, 0xdc, 0x00, 0xf7, 0x9a, 0x00, 0x00]);
});

test('encodeDisplayFrame appends a deterministic crc8 byte', () => {
  const first = encodeDisplayFrame({ seq: 1, brightness: 200, slots: [] });
  const second = encodeDisplayFrame({ seq: 1, brightness: 200, slots: [] });

  assert.equal(first[63], second[63]);
  assert.notEqual(first[63], 0);
});

test('encodeDisplayFrame clamps brightness and sequence values to one byte', () => {
  const frame = encodeDisplayFrame({ seq: 999, brightness: 999, slots: [] });

  assert.equal(frame[3], 255);
  assert.equal(frame[4], 255);
});
