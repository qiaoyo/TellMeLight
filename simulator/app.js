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
let selectedSlotIndex = SLOT_COUNT - 1;

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
  selectedSlotIndex = SLOT_COUNT - 1;
}

function updateSelected(state) {
  const selected = slots[selectedSlotIndex];
  if (selected) {
    selected.state = state;
  }
  render();
}

function clearSelected() {
  if (!slots[selectedSlotIndex]) {
    render();
    return;
  }

  const shifted = [
    ...slots.slice(0, selectedSlotIndex),
    ...slots.slice(selectedSlotIndex + 1),
    null,
  ];
  slots.splice(0, SLOT_COUNT, ...shifted);
  render();
}

function selectSlot(index) {
  selectedSlotIndex = index;
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
    const selectedClass = index === selectedSlotIndex ? ' is-selected' : '';
    node.className = `slot ${slotClass(state)}${selectedClass}`;
    node.dataset.state = state;
    node.dataset.sessionId = session?.id ?? '';
    node.dataset.selected = String(index === selectedSlotIndex);
    node.setAttribute('aria-selected', String(index === selectedSlotIndex));
    node.setAttribute('aria-label', session ? `${session.id} ${state}` : `slot ${index + 1} idle`);
  }

  document.querySelector('#slot-json').textContent = JSON.stringify(
    slots.map((session, index) => ({
      slot: index,
      id: session?.id ?? null,
      state: session?.state ?? STATE.IDLE,
      selected: index === selectedSlotIndex,
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

  if (action === 'running') {
    updateSelected(STATE.RUNNING);
    return;
  }

  if (action === 'approval') {
    updateSelected(STATE.APPROVAL);
    return;
  }

  if (action === 'done') {
    updateSelected(STATE.DONE);
    return;
  }

  if (action === 'error') {
    updateSelected(STATE.ERROR);
    return;
  }

  if (action === 'clear-selected') {
    clearSelected();
  }
}

document.addEventListener('click', (event) => {
  const slot = event.target.closest('[data-slot]');
  if (slot) {
    selectSlot(Number(slot.dataset.slot));
    return;
  }

  const button = event.target.closest('[data-action]');
  if (!button) {
    return;
  }

  handleAction(button.dataset.action);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const slot = event.target.closest('[data-slot]');
  if (!slot) {
    return;
  }

  event.preventDefault();
  selectSlot(Number(slot.dataset.slot));
});

slots[SLOT_COUNT - 1] = createSession(STATE.RUNNING);
render();
