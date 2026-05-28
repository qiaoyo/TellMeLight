# Local Simulation Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-only TellMeLight foundation: FIFO session model, event schema, HID frame encoder, static browser simulator, and hardware decision notes.

**Architecture:** The first implementation milestone is software-only. A dependency-free Node.js core models normalized session events and six display slots; a static browser simulator renders the refined four-bar, six-zone layout; hardware work is represented as decision records and notes, not PCB files.

**Tech Stack:** JavaScript ES modules, Node.js built-in `node:test`, PowerShell runner for Windows, static HTML/CSS/JS simulator, Markdown docs.

---

## File Structure

- `package.json`: project metadata and script commands.
- `tools/run-node.ps1`: Windows-friendly Node launcher that uses global Node when available and falls back to Codex-bundled Node on this machine.
- `host/src/states.js`: state constants, slot constants, and color/animation defaults.
- `host/src/fifo.js`: pure FIFO state machine for session events.
- `host/src/schema.js`: validation and normalization for local API events.
- `host/src/hid-frame.js`: fixed-size 64-byte HID frame encoder.
- `host/test/fifo.test.js`: FIFO behavior tests.
- `host/test/schema.test.js`: local API schema tests.
- `host/test/hid-frame.test.js`: HID frame encoding tests.
- `simulator/index.html`: static simulator shell.
- `simulator/styles.css`: simulator visual styling for the refined four-bar face.
- `simulator/app.js`: browser-side rendering and sample event playback.
- `host/test/simulator-assets.test.js`: static simulator asset smoke tests.
- `hardware/notes/rev-a-architecture.md`: local hardware architecture notes, no PCB files yet.
- `docs/decisions/0001-local-simulation-first.md`: decision record for software simulation before PCB layout.
- `README.md`: project overview and local commands.

## Task 1: Project Skeleton And Node Runner

**Files:**
- Create: `package.json`
- Create: `tools/run-node.ps1`
- Create: `README.md`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "tellmelight",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Local-first design and simulation foundation for TellMeLight.",
  "scripts": {
    "test": "node --test host/test/*.test.js"
  }
}
```

- [ ] **Step 2: Create the Windows Node runner**

Create `tools/run-node.ps1`:

```powershell
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$NodeArgs
)

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    & $nodeCommand.Source @NodeArgs
    exit $LASTEXITCODE
}

$codexBin = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin'
$codexNodes = @()
if (Test-Path -LiteralPath $codexBin) {
    $codexNodes = Get-ChildItem -Path $codexBin -Recurse -Filter node.exe -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
}

if ($codexNodes.Count -gt 0) {
    & $codexNodes[0].FullName @NodeArgs
    exit $LASTEXITCODE
}

Write-Error 'Node.js was not found. Install Node.js or run this project from a Codex environment with bundled Node.'
exit 1
```

- [ ] **Step 3: Create README with local commands**

Create `README.md`:

```markdown
# TellMeLight

TellMeLight is a USB-connected AI hardware design for visualizing local AI sessions as a persistent six-slot light queue.

Current milestone: local software simulation only. No real PCB or USB device is required.

## Local Commands

Run all tests on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Open the static simulator:

```text
simulator/index.html
```

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
```

- [ ] **Step 4: Verify Node runner**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -e "console.log('node-ok')"
```

Expected: command prints `node-ok` and exits with code 0.

- [ ] **Step 5: Commit skeleton**

Run:

```bash
git add package.json tools/run-node.ps1 README.md
git commit -m "chore: add local project skeleton"
```

## Task 2: FIFO Core

**Files:**
- Create: `host/src/states.js`
- Create: `host/src/fifo.js`
- Test: `host/test/fifo.test.js`

- [ ] **Step 1: Write failing FIFO tests**

Create `host/test/fifo.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyModel, applyEvent } from '../src/fifo.js';
import { STATE } from '../src/states.js';

function ids(model) {
  return model.slots.map((slot) => slot?.sessionId ?? null);
}

function states(model) {
  return model.slots.map((slot) => slot?.state ?? STATE.IDLE);
}

test('started inserts newest session into slot 6 and shifts older sessions left', () => {
  let model = createEmptyModel();

  for (const sessionId of ['s1', 's2', 's3']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  assert.deepEqual(ids(model), [null, null, null, 's1', 's2', 's3']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.RUNNING, STATE.RUNNING, STATE.RUNNING]);
});

test('seventh started event evicts slot 1 and appends newest session', () => {
  let model = createEmptyModel();

  for (const sessionId of ['s1', 's2', 's3', 's4', 's5', 's6', 's7']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  assert.deepEqual(ids(model), ['s2', 's3', 's4', 's5', 's6', 's7']);
  assert.equal(model.history.at(-1).type, 'evicted');
  assert.equal(model.history.at(-1).sessionId, 's1');
});

test('state_changed updates an existing session in place', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'state_changed', state: STATE.APPROVAL });

  assert.deepEqual(ids(model), [null, null, null, null, null, 's1']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.APPROVAL]);
});

test('state_changed for unknown session creates a new visible session', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 'late', event: 'state_changed', state: STATE.APPROVAL });

  assert.deepEqual(ids(model), [null, null, null, null, null, 'late']);
  assert.deepEqual(states(model), [STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.IDLE, STATE.APPROVAL]);
});

test('ended keeps session visible and maps default outcome to done', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended' });

  assert.deepEqual(ids(model), [null, null, null, null, null, 's1']);
  assert.equal(model.slots[5].state, STATE.DONE);
});

test('ended with error outcome keeps session visible as error', () => {
  let model = createEmptyModel();
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'started', state: STATE.RUNNING });
  model = applyEvent(model, { source: 'test', sessionId: 's1', event: 'ended', outcome: 'error' });

  assert.equal(model.slots[5].state, STATE.ERROR);
});

test('cleared removes a session and compacts remaining sessions left', () => {
  let model = createEmptyModel();
  for (const sessionId of ['s1', 's2', 's3', 's4']) {
    model = applyEvent(model, { source: 'test', sessionId, event: 'started', state: STATE.RUNNING });
  }

  model = applyEvent(model, { source: 'test', sessionId: 's2', event: 'cleared' });

  assert.deepEqual(ids(model), [null, null, null, 's1', 's3', 's4']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/fifo.test.js
```

Expected: FAIL because `host/src/fifo.js` and `host/src/states.js` do not exist.

- [ ] **Step 3: Implement state constants**

Create `host/src/states.js`:

```js
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
```

- [ ] **Step 4: Implement FIFO core**

Create `host/src/fifo.js`:

```js
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
    if (index >= 0) {
      next.slots[index] = mergeSlot(next.slots[index], event, STATE.RUNNING);
      return bump(next, event);
    }
    return appendSession(next, event, event.state ?? STATE.RUNNING);
  }

  if (event.event === EVENT.STATE_CHANGED) {
    if (index >= 0) {
      next.slots[index] = mergeSlot(next.slots[index], event, event.state ?? next.slots[index].state);
      return bump(next, event);
    }
    return appendSession(next, event, event.state ?? STATE.RUNNING);
  }

  if (event.event === EVENT.ENDED) {
    const state = event.outcome === 'error' ? STATE.ERROR : STATE.DONE;
    if (index >= 0) {
      next.slots[index] = mergeSlot(next.slots[index], event, state);
      return bump(next, event);
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
  if (nonEmpty.length === SLOT_COUNT) {
    const evicted = nonEmpty.shift();
    model.history.push({ type: 'evicted', sessionId: evicted.sessionId, source: evicted.source });
  }

  nonEmpty.push(createSlot(event, state));
  model.slots = leftPadWithIdle(nonEmpty);
  return bump(model, event);
}

function clearSession(model, event) {
  const nonEmpty = model.slots.filter((slot) => slot && slot.sessionId !== event.sessionId);
  model.slots = leftPadWithIdle(nonEmpty);
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

function bump(model, event) {
  model.revision += 1;
  model.history.push({ type: event.event, sessionId: event.sessionId, state: event.state ?? null });
  return model;
}
```

- [ ] **Step 5: Run FIFO tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/fifo.test.js
```

Expected: PASS for 7 tests.

- [ ] **Step 6: Commit FIFO core**

Run:

```bash
git add host/src/states.js host/src/fifo.js host/test/fifo.test.js
git commit -m "feat: add FIFO session model"
```

## Task 3: Local API Event Schema

**Files:**
- Create: `host/src/schema.js`
- Test: `host/test/schema.test.js`

- [ ] **Step 1: Write failing schema tests**

Create `host/test/schema.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeEvent } from '../src/schema.js';
import { EVENT, STATE } from '../src/states.js';

test('normalizeEvent converts snake_case session_id into internal sessionId', () => {
  const event = normalizeEvent({
    source: 'codex',
    session_id: 'abc123',
    event: 'started',
    state: 'running',
    title: 'Build firmware',
    time: '2026-05-29T00:00:00+08:00',
  });

  assert.deepEqual(event, {
    source: 'codex',
    sessionId: 'abc123',
    event: EVENT.STARTED,
    state: STATE.RUNNING,
    title: 'Build firmware',
    time: '2026-05-29T00:00:00+08:00',
    outcome: undefined,
  });
});

test('normalizeEvent defaults started state to running', () => {
  const event = normalizeEvent({
    source: 'manual',
    session_id: 's1',
    event: 'started',
  });

  assert.equal(event.state, STATE.RUNNING);
});

test('normalizeEvent accepts ended without state', () => {
  const event = normalizeEvent({
    source: 'manual',
    session_id: 's1',
    event: 'ended',
  });

  assert.equal(event.event, EVENT.ENDED);
  assert.equal(event.state, undefined);
});

test('normalizeEvent rejects unknown states', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'started', state: 'paused' }),
    /Unsupported state/
  );
});

test('normalizeEvent rejects missing session_id', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', event: 'started', state: 'running' }),
    /session_id/
  );
});

test('normalizeEvent rejects unknown events', () => {
  assert.throws(
    () => normalizeEvent({ source: 'manual', session_id: 's1', event: 'renamed' }),
    /Unsupported event/
  );
});
```

- [ ] **Step 2: Run schema tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/schema.test.js
```

Expected: FAIL because `host/src/schema.js` does not exist.

- [ ] **Step 3: Implement schema normalization**

Create `host/src/schema.js`:

```js
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

  const state = payload.state ?? defaultStateForEvent(event);
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
```

- [ ] **Step 4: Run schema tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/schema.test.js
```

Expected: PASS for 6 tests.

- [ ] **Step 5: Run FIFO and schema tests together**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/fifo.test.js host/test/schema.test.js
```

Expected: PASS for all tests.

- [ ] **Step 6: Commit schema**

Run:

```bash
git add host/src/schema.js host/test/schema.test.js
git commit -m "feat: add local event schema"
```

## Task 4: HID Frame Encoder

**Files:**
- Create: `host/src/hid-frame.js`
- Test: `host/test/hid-frame.test.js`

- [ ] **Step 1: Write failing HID frame tests**

Create `host/test/hid-frame.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeDisplayFrame } from '../src/hid-frame.js';
import { STATE } from '../src/states.js';

test('encodeDisplayFrame returns a 64-byte frame with TellMeLight magic', () => {
  const frame = encodeDisplayFrame({
    seq: 7,
    brightness: 128,
    slots: [{ sessionId: 'a', state: STATE.RUNNING }],
  });

  assert.equal(frame.length, 64);
  assert.equal(String.fromCharCode(frame[0], frame[1]), 'TL');
  assert.equal(frame[2], 1);
  assert.equal(frame[3], 7);
  assert.equal(frame[4], 128);
});

test('encodeDisplayFrame encodes slot state and animation intent', () => {
  const frame = encodeDisplayFrame({
    seq: 1,
    brightness: 255,
    slots: [
      { sessionId: 'a', state: STATE.RUNNING },
      { sessionId: 'b', state: STATE.APPROVAL },
      { sessionId: 'c', state: STATE.DONE },
      { sessionId: 'd', state: STATE.ERROR },
      null,
      null,
    ],
  });

  assert.equal(frame[8], 1);
  assert.equal(frame[9], 2);
  assert.equal(frame[16], 2);
  assert.equal(frame[17], 3);
  assert.equal(frame[24], 3);
  assert.equal(frame[25], 1);
  assert.equal(frame[32], 4);
  assert.equal(frame[33], 4);
  assert.equal(frame[40], 0);
  assert.equal(frame[48], 0);
});

test('encodeDisplayFrame appends a deterministic crc8 byte', () => {
  const first = encodeDisplayFrame({ seq: 1, brightness: 200, slots: [] });
  const second = encodeDisplayFrame({ seq: 1, brightness: 200, slots: [] });

  assert.equal(first[63], second[63]);
  assert.notEqual(first[63], 0);
});

test('encodeDisplayFrame clamps brightness and sequence values to one byte', () => {
  const frame = encodeDisplayFrame({ seq: 999, brightness: 999, slots: [] });

  assert.equal(frame[3], 255);
  assert.equal(frame[4], 255);
});
```

- [ ] **Step 2: Run HID tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hid-frame.test.js
```

Expected: FAIL because `host/src/hid-frame.js` does not exist.

- [ ] **Step 3: Implement HID frame encoder**

Create `host/src/hid-frame.js`:

```js
import { ANIMATION, SLOT_COUNT, STATE, STATE_RENDERING } from './states.js';

const FRAME_SIZE = 64;
const SLOT_SIZE = 8;
const SLOT_OFFSET = 8;

const STATE_CODE = Object.freeze({
  [STATE.IDLE]: 0,
  [STATE.RUNNING]: 1,
  [STATE.APPROVAL]: 2,
  [STATE.DONE]: 3,
  [STATE.ERROR]: 4,
});

const ANIMATION_CODE = Object.freeze({
  [ANIMATION.OFF]: 0,
  [ANIMATION.STEADY]: 1,
  [ANIMATION.BREATHE]: 2,
  [ANIMATION.PULSE]: 3,
  [ANIMATION.WARNING]: 4,
});

export function encodeDisplayFrame({ seq = 0, brightness = 255, flags = 0, slots = [] }) {
  const frame = new Uint8Array(FRAME_SIZE);

  frame[0] = 'T'.charCodeAt(0);
  frame[1] = 'L'.charCodeAt(0);
  frame[2] = 1;
  frame[3] = byte(seq);
  frame[4] = byte(brightness);
  frame[5] = byte(flags);
  frame[6] = 0;
  frame[7] = 0;

  for (let index = 0; index < SLOT_COUNT; index += 1) {
    encodeSlot(frame, index, slots[index]);
  }

  frame[63] = crc8(frame.subarray(0, 63));
  return frame;
}

function encodeSlot(frame, index, slot) {
  const offset = SLOT_OFFSET + index * SLOT_SIZE;
  const state = slot?.state ?? STATE.IDLE;
  const rendering = STATE_RENDERING[state] ?? STATE_RENDERING[STATE.IDLE];

  frame[offset] = STATE_CODE[state] ?? 0;
  frame[offset + 1] = ANIMATION_CODE[slot?.anim ?? rendering.animation] ?? ANIMATION_CODE[rendering.animation];
  frame[offset + 2] = byte(slot?.intensity ?? rendering.intensity);
  frame[offset + 3] = byte(slot?.age ?? 0);

  const hash = labelHash(slot?.sessionId ?? '');
  frame[offset + 4] = hash & 0xff;
  frame[offset + 5] = (hash >> 8) & 0xff;
  frame[offset + 6] = 0;
  frame[offset + 7] = 0;
}

function byte(value) {
  const number = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(255, number));
}

function labelHash(value) {
  let hash = 5381;
  for (const character of value) {
    hash = ((hash << 5) + hash + character.charCodeAt(0)) & 0xffff;
  }
  return hash;
}

function crc8(bytes) {
  let crc = 0x5a;
  for (const byteValue of bytes) {
    crc ^= byteValue;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}
```

- [ ] **Step 4: Run HID tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hid-frame.test.js
```

Expected: PASS for 4 tests.

- [ ] **Step 5: Run all host tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: PASS for all implemented tests.

- [ ] **Step 6: Commit HID encoder**

Run:

```bash
git add host/src/hid-frame.js host/test/hid-frame.test.js
git commit -m "feat: encode HID display frames"
```

## Task 5: Static Browser Simulator

**Files:**
- Create: `simulator/index.html`
- Create: `simulator/styles.css`
- Create: `simulator/app.js`
- Test: `host/test/simulator-assets.test.js`

- [ ] **Step 1: Write failing simulator asset tests**

Create `host/test/simulator-assets.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('simulator html loads app and stylesheet', async () => {
  const html = await readFile('simulator/index.html', 'utf8');

  assert.match(html, /TellMeLight Simulator/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
});

test('simulator app defines six FIFO slots', async () => {
  const app = await readFile('simulator/app.js', 'utf8');

  assert.match(app, /const SLOT_COUNT = 6/);
  assert.match(app, /session-1/);
  assert.match(app, /session-6/);
});

test('simulator styles preserve four-bar physical language', async () => {
  const css = await readFile('simulator/styles.css', 'utf8');

  assert.match(css, /\.device-face/);
  assert.match(css, /\.bar-left-long/);
  assert.match(css, /\.bar-right-long/);
  assert.match(css, /\.bar-middle-low/);
  assert.match(css, /\.bar-middle-high/);
});
```

- [ ] **Step 2: Run simulator tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/simulator-assets.test.js
```

Expected: FAIL because simulator files do not exist.

- [ ] **Step 3: Create simulator HTML**

Create `simulator/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TellMeLight Simulator</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <main class="workspace">
      <section class="device-panel" aria-label="TellMeLight device preview">
        <div class="device-face">
          <div class="bar bar-left-long">
            <div class="zone zone-top" data-slot="0" id="session-1"></div>
            <div class="zone zone-bottom" data-slot="1" id="session-2"></div>
          </div>
          <div class="bar bar-middle-low">
            <div class="zone zone-single" data-slot="2" id="session-3"></div>
          </div>
          <div class="bar bar-middle-high">
            <div class="zone zone-single" data-slot="3" id="session-4"></div>
          </div>
          <div class="bar bar-right-long">
            <div class="zone zone-top" data-slot="4" id="session-5"></div>
            <div class="zone zone-bottom" data-slot="5" id="session-6"></div>
          </div>
        </div>
      </section>

      <section class="controls" aria-label="Simulator controls">
        <h1>TellMeLight Simulator</h1>
        <div class="button-row">
          <button type="button" data-action="add-running">Add Running</button>
          <button type="button" data-action="approval">Newest Approval</button>
          <button type="button" data-action="done">Newest Done</button>
          <button type="button" data-action="error">Newest Error</button>
          <button type="button" data-action="clear-oldest">Clear Oldest</button>
        </div>
        <pre id="slot-json" aria-live="polite"></pre>
      </section>
    </main>
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Create simulator styles**

Create `simulator/styles.css`:

```css
:root {
  color-scheme: dark;
  --surface: #101318;
  --page: #171717;
  --text: #f8fafc;
  --muted: #94a3b8;
  --idle: #111827;
  --running: #38bdf8;
  --approval: #f59e0b;
  --done: #22c55e;
  --error: #ef4444;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top, #27272a, var(--page));
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 440px);
  gap: 32px;
  align-items: center;
  min-height: 100vh;
  padding: 48px;
}

.device-panel {
  display: grid;
  place-items: center;
}

.device-face {
  width: min(72vw, 520px);
  aspect-ratio: 1.88 / 1;
  border-radius: 68px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 34px;
  padding: 48px;
  box-shadow: 0 32px 80px rgb(0 0 0 / 40%);
}

.bar {
  width: 56px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--idle);
  border: 1px solid rgb(148 163 184 / 20%);
}

.bar-left-long {
  height: 158px;
  transform: translateY(2px);
}

.bar-right-long {
  height: 178px;
}

.bar-middle-low,
.bar-middle-high {
  height: 94px;
}

.bar-middle-low {
  transform: translateY(40px);
}

.bar-middle-high {
  transform: translateY(26px);
}

.zone {
  min-height: 100%;
  background: var(--idle);
  transition: background 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
}

.bar-left-long .zone,
.bar-right-long .zone {
  min-height: 50%;
}

.zone-top {
  border-bottom: 4px solid var(--surface);
}

.zone-bottom {
  border-top: 4px solid var(--surface);
}

.state-running {
  background: var(--running);
  animation: breathe 2.8s ease-in-out infinite;
}

.state-approval {
  background: var(--approval);
  animation: pulse 1.4s ease-in-out infinite;
}

.state-done {
  background: var(--done);
  box-shadow: 0 0 28px rgb(34 197 94 / 48%);
}

.state-error {
  background: var(--error);
  box-shadow: 0 0 30px rgb(239 68 68 / 56%);
}

.state-idle {
  background: var(--idle);
}

.controls {
  background: rgb(15 23 42 / 64%);
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 12px;
  padding: 24px;
}

h1 {
  margin: 0 0 18px;
  font-size: 22px;
}

.button-row {
  display: grid;
  gap: 10px;
}

button {
  min-height: 38px;
  border: 1px solid rgb(148 163 184 / 28%);
  border-radius: 8px;
  background: #1f2937;
  color: var(--text);
  cursor: pointer;
}

pre {
  min-height: 180px;
  margin: 18px 0 0;
  padding: 16px;
  overflow: auto;
  border-radius: 8px;
  background: #020617;
  color: var(--muted);
}

@keyframes breathe {
  0%, 100% { opacity: 0.58; box-shadow: 0 0 12px rgb(56 189 248 / 24%); }
  50% { opacity: 1; box-shadow: 0 0 34px rgb(56 189 248 / 60%); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.72; box-shadow: 0 0 18px rgb(245 158 11 / 36%); }
  50% { opacity: 1; box-shadow: 0 0 38px rgb(245 158 11 / 72%); }
}

@media (max-width: 860px) {
  .workspace {
    grid-template-columns: 1fr;
    padding: 24px;
  }

  .device-face {
    width: min(92vw, 420px);
    gap: 22px;
    padding: 34px;
  }
}
```

- [ ] **Step 5: Create simulator app**

Create `simulator/app.js`:

```js
const SLOT_COUNT = 6;

const STATE = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  APPROVAL: 'approval',
  DONE: 'done',
  ERROR: 'error',
});

let nextId = 1;
let slots = Array.from({ length: SLOT_COUNT }, () => null);

const slotJson = document.querySelector('#slot-json');

document.querySelector('[data-action="add-running"]').addEventListener('click', () => {
  addSession({ sessionId: `session-${nextId++}`, state: STATE.RUNNING });
});

document.querySelector('[data-action="approval"]').addEventListener('click', () => {
  updateNewest(STATE.APPROVAL);
});

document.querySelector('[data-action="done"]').addEventListener('click', () => {
  updateNewest(STATE.DONE);
});

document.querySelector('[data-action="error"]').addEventListener('click', () => {
  updateNewest(STATE.ERROR);
});

document.querySelector('[data-action="clear-oldest"]').addEventListener('click', () => {
  const firstIndex = slots.findIndex(Boolean);
  if (firstIndex >= 0) {
    slots = [...slots.slice(0, firstIndex), ...slots.slice(firstIndex + 1), null];
    render();
  }
});

function addSession(slot) {
  const active = slots.filter(Boolean);
  if (active.length === SLOT_COUNT) active.shift();
  active.push(slot);
  slots = [...Array.from({ length: SLOT_COUNT - active.length }, () => null), ...active];
  render();
}

function updateNewest(state) {
  const index = findNewestIndex();
  if (index < 0) return;
  slots[index] = { ...slots[index], state };
  render();
}

function findNewestIndex() {
  for (let index = SLOT_COUNT - 1; index >= 0; index -= 1) {
    if (slots[index]) return index;
  }
  return -1;
}

function render() {
  for (let index = 0; index < SLOT_COUNT; index += 1) {
    const element = document.querySelector(`[data-slot="${index}"]`);
    const state = slots[index]?.state ?? STATE.IDLE;
    element.className = `zone ${zoneClass(index)} state-${state}`;
  }
  slotJson.textContent = JSON.stringify(slots, null, 2);
}

function zoneClass(index) {
  if (index === 0 || index === 4) return 'zone-top';
  if (index === 1 || index === 5) return 'zone-bottom';
  return 'zone-single';
}

addSession({ sessionId: 'session-1', state: STATE.RUNNING });
render();
```

- [ ] **Step 6: Run simulator asset tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/simulator-assets.test.js
```

Expected: PASS for 3 tests.

- [ ] **Step 7: Open simulator manually**

Open `simulator/index.html` in a browser and click each control. Expected:

- `Add Running` shifts the queue left and appends a cyan/blue running session on the rightmost slot.
- `Newest Approval` changes the newest session to amber pulsing.
- `Newest Done` changes the newest session to green steady.
- `Newest Error` changes the newest session to red.
- `Clear Oldest` removes the oldest visible session and compacts the queue.

- [ ] **Step 8: Commit simulator**

Run:

```bash
git add simulator/index.html simulator/styles.css simulator/app.js host/test/simulator-assets.test.js
git commit -m "feat: add local light simulator"
```

## Task 6: Hardware Notes And Decision Record

**Files:**
- Create: `hardware/notes/rev-a-architecture.md`
- Create: `docs/decisions/0001-local-simulation-first.md`
- Test: `host/test/docs.test.js`

- [ ] **Step 1: Write failing docs tests**

Create `host/test/docs.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('hardware architecture note records selected rev A parts', async () => {
  const note = await readFile('hardware/notes/rev-a-architecture.md', 'utf8');

  assert.match(note, /USB-C/);
  assert.match(note, /RP2040-class/);
  assert.match(note, /LP5024-class/);
  assert.match(note, /six RGB light zones/);
});

test('local simulation decision prevents early PCB layout', async () => {
  const decision = await readFile('docs/decisions/0001-local-simulation-first.md', 'utf8');

  assert.match(decision, /Accepted/);
  assert.match(decision, /No PCB layout/);
  assert.match(decision, /FIFO/);
  assert.match(decision, /simulator/);
});
```

- [ ] **Step 2: Run docs tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: FAIL because docs do not exist.

- [ ] **Step 3: Create hardware architecture note**

Create `hardware/notes/rev-a-architecture.md`:

```markdown
# TellMeLight Rev A Hardware Architecture Notes

Rev A is an integrated USB device, but this milestone does not create PCB layout files.

## Selected Direction

- USB-C for power and data.
- RP2040-class USB MCU.
- LP5024-class I2C RGB LED driver.
- Six RGB light zones using 18 LED driver channels.
- Four visible diffuser bars:
  - Left long bar has two zones.
  - Left middle bar has one zone.
  - Right middle bar has one zone.
  - Right long bar has two zones.

## Local-Only Milestone Boundary

This milestone creates software simulation, protocol tests, and documentation. It does not create schematic, PCB layout, Gerbers, BOM, or enclosure CAD.

## Open Hardware Questions

- Whether each light zone can use one RGB LED or needs multiple LEDs for smoother diffusion.
- Exact USB-C protection and ESD component choices.
- Exact LP5024 package and footprint.
- Mechanical light-isolation wall thickness between split long-bar zones.
```

- [ ] **Step 4: Create decision record**

Create `docs/decisions/0001-local-simulation-first.md`:

```markdown
# 0001: Build Local Simulation Before PCB Layout

## Status

Accepted

## Context

TellMeLight is intended to become integrated PCB hardware, but no physical prototype exists yet. The six-session FIFO behavior, state language, and USB display protocol can be verified locally before schematic or PCB layout begins.

## Decision

Build the local software foundation first:

- FIFO state-machine tests.
- Local API event schema tests.
- HID frame encoder tests.
- Browser simulator for the refined four-bar, six-zone layout.
- Hardware architecture notes.

No PCB layout starts until these local pieces are executable and testable.

## Consequences

- We reduce the chance of changing PCB assumptions because of late software model changes.
- The simulator gives immediate visual feedback without waiting for hardware.
- Hardware automation can later use a more stable spec and test suite.
```

- [ ] **Step 5: Run docs tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: PASS for 2 tests.

- [ ] **Step 6: Commit docs**

Run:

```bash
git add hardware/notes/rev-a-architecture.md docs/decisions/0001-local-simulation-first.md host/test/docs.test.js
git commit -m "docs: record local simulation hardware boundary"
```

## Task 7: Final Local Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README with milestone status**

Modify `README.md` so it contains:

```markdown
# TellMeLight

TellMeLight is a USB-connected AI hardware design for visualizing local AI sessions as a persistent six-slot light queue.

Current milestone: local software simulation only. No real PCB or USB device is required.

## Local Commands

Run all tests on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Open the static simulator:

```text
simulator/index.html
```

## Milestone 1 Contents

- FIFO session model.
- Local API event schema.
- HID display frame encoder.
- Browser simulator.
- Hardware architecture notes.
- Decision record that blocks PCB layout until simulation is testable.

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
- `docs/superpowers/plans/2026-05-29-local-simulation-foundation.md`
```

- [ ] **Step 2: Run the full local test suite**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: PASS for FIFO, schema, HID frame, simulator asset, and docs tests.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only unrelated user files such as `record.docx` and `~$record.docx` remain untracked.

- [ ] **Step 4: Commit README update**

Run:

```bash
git add README.md
git commit -m "docs: describe local simulation milestone"
```

- [ ] **Step 5: Push checkpoint**

Run:

```bash
git push
```

Expected: commits are pushed to the configured GitHub remote. If the push fails because the remote branch has unrelated history or authentication is unavailable, stop and report the exact error.

## Self-Review

- Spec coverage:
  - FIFO session queue: Task 2.
  - Local API event schema: Task 3.
  - HID frame encoder: Task 4.
  - Static simulator: Task 5.
  - Hardware notes and PCB deferral: Task 6.
  - Repo skeleton and verification commands: Tasks 1 and 7.
- Out of scope for this plan:
  - Real USB HID writer.
  - Firmware build.
  - KiCad schematic and PCB layout.
  - Real AI-tool adapters.
- Completeness scan:
  - The plan contains concrete file paths, commands, expected results, and implementation snippets for each task.
- Type consistency:
  - `session_id` is the external API field.
  - `sessionId` is the internal model field.
  - States are `idle`, `running`, `approval`, `done`, and `error`.
  - Events are `started`, `state_changed`, `ended`, and `cleared`.
