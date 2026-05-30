import { pathToFileURL } from 'node:url';

export const DEMO_EVENTS = [
  {
    source: 'demo',
    session_id: 'demo-a',
    event: 'started',
    title: 'Demo A',
  },
  {
    source: 'demo',
    session_id: 'demo-b',
    event: 'started',
    title: 'Demo B',
  },
  {
    source: 'demo',
    session_id: 'demo-a',
    event: 'state_changed',
    state: 'approval',
    title: 'Demo A waiting approval',
  },
  {
    source: 'demo',
    session_id: 'demo-b',
    event: 'ended',
    outcome: 'success',
    title: 'Demo B complete',
  },
  ...Array.from({ length: 5 }, (_, index) => ({
    source: 'demo',
    session_id: `demo-extra-${index + 1}`,
    event: 'started',
    title: `Demo Extra ${index + 1}`,
  })),
];

const baseUrl = process.env.TELLMELIGHT_URL ?? 'http://127.0.0.1:8787';

if (isMainModule()) {
  await runDemo(baseUrl);
}

export async function runDemo(targetBaseUrl = baseUrl) {
  for (const event of DEMO_EVENTS) {
    const response = await fetch(`${targetBaseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Demo event failed with ${response.status}: ${body}`);
    }

    console.log(`${event.event} ${event.session_id}`);
    await wait(250);
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
