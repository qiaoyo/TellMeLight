import { createServer } from 'node:http';
import { createBridge } from './bridge-state.js';

const MAX_BODY_BYTES = 64 * 1024;

export function createHostBridgeServer({ bridge = createBridge() } = {}) {
  return createServer(createHostBridgeRequestHandler(bridge));
}

export function createHostBridgeRequestHandler(bridge) {
  return async (request, response) => {
    setCorsHeaders(response);

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/v1/slots') {
      writeJson(response, 200, bridge.snapshot());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/v1/events') {
      await handleEventPost(request, response, bridge);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/v1/stream') {
      handleEventStream(request, response, bridge);
      return;
    }

    writeJson(response, 404, { error: 'Not found' });
  };
}

async function handleEventPost(request, response, bridge) {
  try {
    const payload = JSON.parse(await readRequestBody(request));
    writeJson(response, 202, bridge.applyEventPayload(payload));
  } catch (error) {
    const message = error instanceof SyntaxError ? 'Invalid JSON' : error.message;
    writeJson(response, 400, { error: message });
  }
}

function handleEventStream(request, response, bridge) {
  response.writeHead(200, {
    'access-control-allow-origin': '*',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
    'content-type': 'text/event-stream; charset=utf-8',
  });

  const unsubscribe = bridge.subscribe((snapshot) => {
    response.write(`event: slots\ndata: ${JSON.stringify(snapshot)}\n\n`);
  });

  request.on('close', () => {
    unsubscribe();
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', reject);
  });
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

function setCorsHeaders(response) {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
}
