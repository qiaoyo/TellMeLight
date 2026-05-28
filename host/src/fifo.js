import { EVENT, SLOT_COUNT, STATE } from './states.js';

export function createEmptyModel() {
  return {
    slots: Array.from({ length: SLOT_COUNT }, () => null),
    history: [],
    revision: 0,
  };
}

export function applyEvent(model, event) {
  const next = cloneModel(model);

  if (event.event === EVENT.CLEARED) {
    return clearSession(next, event);
  }

  const index = findSessionIndex(next.slots, event.sessionId);

  if (event.event === EVENT.STARTED) {
    const state = event.state ?? STATE.RUNNING;
    if (index >= 0) {
      next.slots[index] = mergeSlot(next.slots[index], event, state);
      return bump(next, event, state);
    }
    return appendSession(next, event, state);
  }

  if (event.event === EVENT.STATE_CHANGED) {
    if (index >= 0) {
      const state = event.state ?? next.slots[index].state;
      next.slots[index] = mergeSlot(next.slots[index], event, state);
      return bump(next, event, state);
    }
    return appendSession(next, event, event.state ?? STATE.RUNNING);
  }

  if (event.event === EVENT.ENDED) {
    const state = event.outcome === 'error' ? STATE.ERROR : STATE.DONE;
    if (index >= 0) {
      next.slots[index] = mergeSlot(next.slots[index], event, state);
      return bump(next, event, state);
    }
    return appendSession(next, event, state);
  }

  throw new Error(`Unsupported event: ${event.event}`);
}

function cloneModel(model) {
  return {
    slots: model.slots.map((slot) => (slot ? { ...slot } : null)),
    history: model.history.map((entry) => ({ ...entry })),
    revision: model.revision,
  };
}

function appendSession(model, event, state) {
  const nonEmpty = model.slots.filter(Boolean);
  let evictedEntry = null;
  if (nonEmpty.length === SLOT_COUNT) {
    const evicted = nonEmpty.shift();
    evictedEntry = { type: 'evicted', sessionId: evicted.sessionId, source: evicted.source };
  }

  nonEmpty.push(createSlot(event, state));
  model.slots = leftPadWithIdle(nonEmpty);
  bump(model, event, state);
  if (evictedEntry) {
    model.history.push(evictedEntry);
  }
  return model;
}

function clearSession(model, event) {
  const index = findSessionIndex(model.slots, event.sessionId);
  if (index < 0) {
    return bump(model, event);
  }

  model.slots = [
    ...model.slots.slice(0, index),
    ...model.slots.slice(index + 1),
    null,
  ];
  return bump(model, event);
}

function leftPadWithIdle(nonEmptySlots) {
  const emptyCount = SLOT_COUNT - nonEmptySlots.length;
  return [...Array.from({ length: emptyCount }, () => null), ...nonEmptySlots];
}

function createSlot(event, state) {
  return {
    sessionId: event.sessionId,
    source: event.source,
    state,
    title: event.title ?? '',
    updatedAt: event.time ?? new Date().toISOString(),
  };
}

function mergeSlot(slot, event, state) {
  return {
    ...slot,
    source: event.source ?? slot.source,
    state,
    title: event.title ?? slot.title,
    updatedAt: event.time ?? new Date().toISOString(),
  };
}

function findSessionIndex(slots, sessionId) {
  return slots.findIndex((slot) => slot?.sessionId === sessionId);
}

function bump(model, event, state = event.state ?? null) {
  model.revision += 1;
  model.history.push({ type: event.event, sessionId: event.sessionId, state });
  return model;
}
