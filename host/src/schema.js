import { EVENT, STATE, isKnownEvent, isKnownState } from './states.js';

export function normalizeEvent(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Event payload must be an object');
  }

  const source = readRequiredString(payload, 'source');
  const sessionId = readRequiredString(payload, 'session_id');
  const event = readRequiredString(payload, 'event');

  if (!isKnownEvent(event)) {
    throw new Error(`Unsupported event: ${event}`);
  }

  const state = payload.state === undefined ? defaultStateForEvent(event) : payload.state;
  if (state !== undefined && !isKnownState(state)) {
    throw new Error(`Unsupported state: ${state}`);
  }

  const outcome = payload.outcome === undefined ? undefined : String(payload.outcome);

  return {
    source,
    sessionId,
    event,
    state,
    title: payload.title === undefined ? '' : String(payload.title),
    time: payload.time === undefined ? new Date().toISOString() : String(payload.time),
    outcome,
  };
}

function readRequiredString(payload, key) {
  const value = payload[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Field ${key} is required`);
  }
  return value.trim();
}

function defaultStateForEvent(event) {
  if (event === EVENT.STARTED) return STATE.RUNNING;
  return undefined;
}
