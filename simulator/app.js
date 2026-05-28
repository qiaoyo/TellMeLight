const SLOT_COUNT = 6;
const STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  APPROVAL: 'approval',
  DONE: 'done',
  ERROR: 'error',
};
const SESSION_IDS = ['session-1', 'session-2', 'session-3', 'session-4', 'session-5', 'session-6'];

const slots = Array.from({ length: SLOT_COUNT }, () => null);
let nextSessionIndex = 0;

function createSession(state = STATE.RUNNING) {
  const id = SESSION_IDS[nextSessionIndex] ?? `session-${nextSessionIndex + 1}`;
  nextSessionIndex += 1;
  return { id, state };
}

function activeSessions() {
  return slots.filter(Boolean);
}

function placeSessionsRight(sessions) {
  slots.fill(null);
  const visible = sessions.slice(-SLOT_COUNT);
  const offset = SLOT_COUNT - visible.length;
  visible.forEach((session, index) => {
    slots[offset + index] = session;
  });
}

function addRunning() {
  const sessions = activeSessions();
  if (sessions.length === SLOT_COUNT) {
    sessions.shift();
  }
  sessions.push(createSession(STATE.RUNNING));
  placeSessionsRight(sessions);
}

function updateNewest(state) {
  const newest = activeSessions().at(-1);
  if (newest) {
    newest.state = state;
    render();
  }
}

function clearOldest() {
  const oldestIndex = slots.findIndex(Boolean);
  if (oldestIndex < 0) {
    render();
    return;
  }

  const shifted = [
    ...slots.slice(0, oldestIndex),
    ...slots.slice(oldestIndex + 1),
    null,
  ];
  slots.splice(0, SLOT_COUNT, ...shifted);
  render();
}

function slotClass(state) {
  return state === STATE.IDLE ? 'is-idle' : `is-${state}`;
}

function render() {
  for (let index = 0; index < SLOT_COUNT; index += 1) {
    const node = document.querySelector(`[data-slot="${index}"]`);
    const session = slots[index];
    const state = session?.state ?? STATE.IDLE;
    node.className = `slot ${slotClass(state)}`;
    node.dataset.state = state;
    node.dataset.sessionId = session?.id ?? '';
    node.setAttribute('aria-label', session ? `${session.id} ${state}` : `slot ${index + 1} idle`);
  }

  document.querySelector('#slot-json').textContent = JSON.stringify(
    slots.map((session, index) => ({
      slot: index,
      id: session?.id ?? null,
      state: session?.state ?? STATE.IDLE,
    })),
    null,
    2,
  );
}

function handleAction(action) {
  if (action === 'add-running') {
    addRunning();
    render();
    return;
  }

  if (action === 'approval') {
    updateNewest(STATE.APPROVAL);
    return;
  }

  if (action === 'done') {
    updateNewest(STATE.DONE);
    return;
  }

  if (action === 'error') {
    updateNewest(STATE.ERROR);
    return;
  }

  if (action === 'clear-oldest') {
    clearOldest();
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }

  handleAction(button.dataset.action);
});

slots[SLOT_COUNT - 1] = createSession(STATE.RUNNING);
render();
