const REV_A5_SLOT_COUNT = 6;
const REV_A5_MAX_BRIGHTNESS = 0.18;
const REV_A5_STATES = new Set(['idle', 'running', 'approval', 'done', 'error', 'cleared']);

export function buildRevA5Frame(snapshot, { brightness = 0.12 } = {}) {
  const sourceSlots = Array.isArray(snapshot?.slots) ? snapshot.slots : [];
  return {
    slots: Array.from({ length: REV_A5_SLOT_COUNT }, (_, index) => normalizeState(sourceSlots[index]?.state)),
    brightness: clampBrightness(brightness),
    revision: Number.isFinite(snapshot?.revision) ? snapshot.revision : 0,
  };
}

export function serializeRevA5Frame(frame) {
  return `${JSON.stringify({
    slots: frame.slots,
    brightness: frame.brightness,
    revision: frame.revision,
  })}\n`;
}

function normalizeState(state) {
  if (typeof state !== 'string') {
    return 'idle';
  }
  const normalized = state.toLowerCase();
  return REV_A5_STATES.has(normalized) ? normalized : 'idle';
}

function clampBrightness(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0.12;
  }
  return Math.max(0, Math.min(REV_A5_MAX_BRIGHTNESS, number));
}

