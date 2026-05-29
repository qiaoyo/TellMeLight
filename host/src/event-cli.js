import { pathToFileURL } from 'node:url';
import { sendEvent } from './event-client.js';

const COMMANDS = new Set(['started', 'running', 'approval', 'done', 'error', 'cleared']);

export function parseEventCliArgs(args) {
  const [command, ...rest] = args;
  if (!COMMANDS.has(command)) {
    throw new Error(`Command must be one of: ${Array.from(COMMANDS).join(', ')}`);
  }

  const flags = parseFlags(rest);
  return {
    baseUrl: flags.url,
    payload: buildPayload(command, flags),
  };
}

export function buildPayload(command, flags) {
  const sessionId = flags.id;
  if (!sessionId) {
    throw new Error('--id is required');
  }

  const payload = {
    source: flags.source ?? 'manual',
    session_id: sessionId,
    ...payloadForCommand(command),
  };

  if (flags.title) {
    payload.title = flags.title;
  }

  if (flags.time) {
    payload.time = flags.time;
  }

  return payload;
}

export async function runEventCli(args = process.argv.slice(2)) {
  const { baseUrl, payload } = parseEventCliArgs(args);
  const snapshot = await sendEvent(payload, { baseUrl });
  const active = snapshot.slots.filter((slot) => slot.id).length;
  console.log(`sent ${payload.event} ${payload.session_id}; revision=${snapshot.revision}; active=${active}`);
  return snapshot;
}

function payloadForCommand(command) {
  if (command === 'started') {
    return { event: 'started', state: 'running' };
  }

  if (command === 'running' || command === 'approval') {
    return { event: 'state_changed', state: command };
  }

  if (command === 'done') {
    return { event: 'ended', outcome: 'success' };
  }

  if (command === 'error') {
    return { event: 'ended', outcome: 'error' };
  }

  return { event: 'cleared' };
}

function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`);
    }

    const name = key.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Flag ${key} requires a value`);
    }

    flags[name] = value;
    index += 1;
  }
  return flags;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  runEventCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
