export const SLOT_COUNT = 6;

export const STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  APPROVAL: 'approval',
  DONE: 'done',
  ERROR: 'error',
});

export const EVENT = Object.freeze({
  STARTED: 'started',
  STATE_CHANGED: 'state_changed',
  ENDED: 'ended',
  CLEARED: 'cleared',
});

export const ANIMATION = Object.freeze({
  OFF: 'off',
  STEADY: 'steady',
  BREATHE: 'breathe',
  PULSE: 'pulse',
  WARNING: 'warning',
});

export const STATE_RENDERING = Object.freeze({
  [STATE.IDLE]: { color: '#000000', animation: ANIMATION.OFF, intensity: 0 },
  [STATE.RUNNING]: { color: '#38bdf8', animation: ANIMATION.BREATHE, intensity: 220 },
  [STATE.APPROVAL]: { color: '#f59e0b', animation: ANIMATION.PULSE, intensity: 255 },
  [STATE.DONE]: { color: '#22c55e', animation: ANIMATION.STEADY, intensity: 220 },
  [STATE.ERROR]: { color: '#ef4444', animation: ANIMATION.WARNING, intensity: 255 },
});

export function isKnownState(state) {
  return Object.values(STATE).includes(state);
}

export function isKnownEvent(event) {
  return Object.values(EVENT).includes(event);
}
