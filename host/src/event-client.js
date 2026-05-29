export const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8787';

export async function sendEvent(payload, { baseUrl = DEFAULT_BRIDGE_URL, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required to send TellMeLight events');
  }

  const response = await fetchImpl(eventUrl(baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(body?.error ?? `Host Bridge rejected event with ${response.status}`);
  }

  return body;
}

function eventUrl(baseUrl) {
  return new URL('/v1/events', normalizeBaseUrl(baseUrl)).href;
}

function normalizeBaseUrl(baseUrl) {
  const value = String(baseUrl ?? '').trim();
  if (!value) {
    throw new Error('Host Bridge URL is required');
  }
  return value.endsWith('/') ? value : `${value}/`;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
