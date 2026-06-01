import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRevA5FrameCliArgs, runRevA5FrameCli } from '../src/rev-a5-frame-cli.js';

test('parseRevA5FrameCliArgs accepts url and brightness overrides', () => {
  const parsed = parseRevA5FrameCliArgs(['--url', 'http://127.0.0.1:9000', '--brightness', '0.15']);

  assert.deepEqual(parsed, {
    baseUrl: 'http://127.0.0.1:9000',
    brightness: 0.15,
  });
});

test('parseRevA5FrameCliArgs rejects unknown flags', () => {
  assert.throws(() => parseRevA5FrameCliArgs(['--port', 'COM7']), /Unexpected flag/);
});

test('runRevA5FrameCli fetches bridge snapshot and writes one JSON line', async () => {
  const writes = [];
  const output = {
    write(text) {
      writes.push(text);
    },
  };
  const fetchSnapshot = async (url) => {
    assert.equal(url, 'http://127.0.0.1:8787/v1/slots');
    return {
      revision: 9,
      slots: [
        { slot: 0, state: 'idle' },
        { slot: 1, state: 'running' },
        { slot: 2, state: 'approval' },
        { slot: 3, state: 'done' },
        { slot: 4, state: 'error' },
        { slot: 5, state: 'idle' },
      ],
    };
  };

  await runRevA5FrameCli([], { fetchSnapshot, output });

  assert.deepEqual(writes, [
    '{"slots":["idle","running","approval","done","error","idle"],"brightness":0.12,"revision":9}\n',
  ]);
});

