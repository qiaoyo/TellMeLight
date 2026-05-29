import assert from 'node:assert/strict';
import test from 'node:test';
import { sendEvent } from '../src/event-client.js';
import { createHostBridgeServer } from '../src/http-server.js';

test('sendEvent posts to the Host Bridge and returns the updated snapshot', async () => {
  await withServer(async (baseUrl) => {
    const snapshot = await sendEvent(
      {
        source: 'adapter-test',
        session_id: 'client-1',
        event: 'started',
        title: 'Client test session',
      },
      { baseUrl },
    );

    assert.equal(snapshot.revision, 1);
    assert.equal(snapshot.slots[5].id, 'client-1');
    assert.equal(snapshot.slots[5].state, 'running');
    assert.equal(snapshot.slots[5].title, 'Client test session');
  });
});

test('sendEvent surfaces Host Bridge rejection messages', async () => {
  await withServer(async (baseUrl) => {
    await assert.rejects(
      () => sendEvent({ source: 'adapter-test', event: 'started' }, { baseUrl }),
      /Field session_id is required/,
    );
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
