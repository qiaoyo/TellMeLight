import { EVENT, STATE, isKnownEvent, isKnownState } from './states.js';

const OUTCOME = Object.freeze({
  SUCCESS: 'success',
  DONE: 'done',
  ERROR: 'error',
});

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

  const outcome = normalizeOutcome(payload.outcome);

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

function normalizeOutcome(outcome) {
  if (outcome === undefined) {
    return undefined;
  }

  if (typeof outcome !== 'string' || outcome.trim() === '') {
    throw new Error(`Unsupported outcome: ${outcome}`);
  }

  const normalized = outcome.trim();
  if (!Object.values(OUTCOME).includes(normalized)) {
    throw new Error(`Unsupported outcome: ${normalized}`);
  }

  return normalized;
}
