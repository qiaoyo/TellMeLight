import { applyEvent, createEmptyModel } from './fifo.js';
import { normalizeEvent } from './schema.js';
import { STATE } from './states.js';

export function createBridge({ initialModel = createEmptyModel() } = {}) {
  let model = initialModel;
  const subscribers = new Set();

  function snapshot() {
    return {
      revision: model.revision,
      slots: model.slots.map((slot, index) => snapshotSlot(slot, index)),
    };
  }

  function applyEventPayload(payload) {
    const event = normalizeEvent(payload);
    model = applyEvent(model, event);
    const nextSnapshot = snapshot();
    notify(nextSnapshot);
    return nextSnapshot;
  }

  function subscribe(listener) {
    subscribers.add(listener);
    listener(snapshot());
    return () => {
      subscribers.delete(listener);
    };
  }

  function notify(nextSnapshot) {
    for (const listener of subscribers) {
      listener(nextSnapshot);
    }
  }

  return {
    applyEventPayload,
    snapshot,
    subscribe,
  };
}

function snapshotSlot(slot, index) {
  return {
    slot: index,
    id: slot?.sessionId ?? null,
    source: slot?.source ?? null,
    title: slot?.title ?? '',
    state: slot?.state ?? STATE.IDLE,
    updatedAt: slot?.updatedAt ?? null,
  };
}
