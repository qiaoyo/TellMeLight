import assert from 'node:assert/strict';
import { get } from 'node:http';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createHostBridgeServer } from '../src/http-server.js';

test('GET /v1/slots returns the current slot snapshot', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/slots`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.equal(body.revision, 0);
    assert.equal(body.slots.length, 6);
    assert.deepEqual(
      body.slots.map((slot) => slot.state),
      ['idle', 'idle', 'idle', 'idle', 'idle', 'idle'],
    );
  });
});

test('POST /v1/events applies an event and returns the updated snapshot', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'manual',
        session_id: 'http-1',
        event: 'started',
        title: 'HTTP session',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 202);
    assert.equal(body.revision, 1);
    assert.equal(body.slots[5].id, 'http-1');
    assert.equal(body.slots[5].state, 'running');
    assert.equal(body.slots[5].title, 'HTTP session');
  });
});

test('POST /v1/events returns a JSON error for invalid payloads', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /Invalid JSON/);
  });
});

test('GET /v1/stream sends the current snapshot and later updates', async () => {
  await withServer(async (baseUrl) => {
    const stream = await openStream(`${baseUrl}/v1/stream`);

    await waitFor(() => stream.text().includes('"revision":0'));
    assert.match(stream.text(), /event: slots/);

    await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'manual', session_id: 'sse-1', event: 'started' }),
    });

    await waitFor(() => stream.text().includes('"revision":1') && stream.text().includes('"id":"sse-1"'));
    stream.close();
  });
});

async function withServer(run) {
  const server = createHostBridgeServer();
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function openStream(url) {
  const chunks = [];
  const request = get(url);
  request.on('response', (response) => {
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });
  });

  await waitFor(() => chunks.join('').includes('event: slots'));

  return {
    close() {
      request.destroy();
    },
    text() {
      return chunks.join('');
    },
  };
}

async function waitFor(condition) {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > 2000) {
      throw new Error('Timed out waiting for condition');
    }
    await delay(10);
  }
}
