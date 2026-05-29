# Host Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Host Bridge that accepts AI session events, exposes the current six-slot state, and streams updates to the simulator.

**Architecture:** The service is a dependency-free Node layer around the existing FIFO and schema modules. `bridge-state` owns mutable in-memory state and subscriber notifications; `http-server` maps local HTTP/SSE routes to the bridge; the simulator consumes the stream but keeps manual fallback behavior.

**Tech Stack:** JavaScript ES modules, Node built-in `http`, Node built-in `node:test`, browser `EventSource`, browser `fetch`, static HTML/CSS/JS.

---

## File Structure

- Create `host/src/bridge-state.js`: bridge model wrapper, slot snapshots, event application, subscriber notification.
- Create `host/src/http-server.js`: dependency-free HTTP request handler, JSON routes, SSE stream, CORS for `file://` simulator use.
- Create `host/src/server-cli.js`: starts the Host Bridge on `127.0.0.1:8787`.
- Create `host/src/demo-client.js`: sends a repeatable local demo event sequence.
- Create `host/test/bridge-state.test.js`: tests snapshots, event application, and subscribers.
- Create `host/test/http-server.test.js`: tests `GET /v1/slots`, `POST /v1/events`, errors, and SSE updates.
- Modify `simulator/app.js`: connect to Host Bridge stream, send manual controls to the bridge when available, keep local fallback.
- Modify `host/test/simulator-assets.test.js`: assert simulator contains bridge connection and fallback hooks.
- Modify `package.json`: add `host` and `demo` scripts.
- Modify `README.md`: document local Host Bridge commands.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record the milestone checkpoint.

## Task 1: Bridge State Module

**Files:**
- Create: `host/src/bridge-state.js`
- Test: `host/test/bridge-state.test.js`

- [ ] **Step 1: Write failing bridge state tests**

Create `host/test/bridge-state.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { createBridge } from '../src/bridge-state.js';

test('bridge snapshot exposes six idle slots', () => {
  const bridge = createBridge();

  assert.equal(bridge.snapshot().revision, 0);
  assert.deepEqual(
    bridge.snapshot().slots.map((slot) => slot.state),
    ['idle', 'idle', 'idle', 'idle', 'idle', 'idle'],
  );
  assert.deepEqual(
    bridge.snapshot().slots.map((slot) => slot.id),
    [null, null, null, null, null, null],
  );
});

test('bridge applies normalized event payloads through the FIFO core', () => {
  const bridge = createBridge();

  const snapshot = bridge.applyEventPayload({
    source: 'manual',
    session_id: 's1',
    event: 'started',
    title: 'First local session',
  });

  assert.equal(snapshot.revision, 1);
  assert.equal(snapshot.slots[5].id, 's1');
  assert.equal(snapshot.slots[5].source, 'manual');
  assert.equal(snapshot.slots[5].state, 'running');
  assert.equal(snapshot.slots[5].title, 'First local session');
});

test('bridge notifies subscribers immediately and after changes', () => {
  const bridge = createBridge();
  const revisions = [];

  const unsubscribe = bridge.subscribe((snapshot) => {
    revisions.push(snapshot.revision);
  });
  bridge.applyEventPayload({ source: 'manual', session_id: 's1', event: 'started' });
  unsubscribe();
  bridge.applyEventPayload({ source: 'manual', session_id: 's2', event: 'started' });

  assert.deepEqual(revisions, [0, 1]);
});
```

- [ ] **Step 2: Run bridge state tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/bridge-state.test.js
```

Expected: FAIL because `host/src/bridge-state.js` does not exist.

- [ ] **Step 3: Implement bridge state**

Create `host/src/bridge-state.js` with `createBridge()`, `snapshot()`, `applyEventPayload(payload)`, and `subscribe(listener)`. It should use `normalizeEvent()` and `applyEvent()` from existing modules.

- [ ] **Step 4: Run bridge state tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/bridge-state.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit bridge state**

```bash
git add host/src/bridge-state.js host/test/bridge-state.test.js
git commit -m "feat: add host bridge state"
```

## Task 2: HTTP And SSE Server

**Files:**
- Create: `host/src/http-server.js`
- Test: `host/test/http-server.test.js`

- [ ] **Step 1: Write failing server tests**

Create tests for:

- `GET /v1/slots` returns six idle slots.
- `POST /v1/events` returns 202 and updates slot 6.
- Invalid JSON returns 400 with `error`.
- `GET /v1/stream` sends an initial `event: slots` frame and another frame after a POST.

- [ ] **Step 2: Run server tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/http-server.test.js
```

Expected: FAIL because `host/src/http-server.js` does not exist.

- [ ] **Step 3: Implement HTTP server**

Create `createHostBridgeServer({ bridge = createBridge() } = {})`. It must:

- Add `Access-Control-Allow-Origin: *`.
- Handle `OPTIONS` with 204.
- Return JSON for `GET /v1/slots`.
- Read and parse JSON for `POST /v1/events`.
- Return 400 JSON on parse or validation errors.
- Stream SSE for `GET /v1/stream`.
- Return 404 JSON for unknown routes.

- [ ] **Step 4: Run server tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/http-server.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit server**

```bash
git add host/src/http-server.js host/test/http-server.test.js
git commit -m "feat: serve host bridge API"
```

## Task 3: CLI And Demo Client

**Files:**
- Create: `host/src/server-cli.js`
- Create: `host/src/demo-client.js`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Add commands**

Add scripts:

```json
"host": "node host/src/server-cli.js",
"demo": "node host/src/demo-client.js"
```

- [ ] **Step 2: Implement CLI**

`server-cli.js` starts the server on `127.0.0.1` and `TELLMELIGHT_PORT || 8787`.

- [ ] **Step 3: Implement demo client**

`demo-client.js` sends a repeatable event sequence to `TELLMELIGHT_URL || http://127.0.0.1:8787`.

- [ ] **Step 4: Verify commands**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit CLI and docs**

```bash
git add host/src/server-cli.js host/src/demo-client.js package.json README.md
git commit -m "feat: add host bridge commands"
```

## Task 4: Simulator Bridge Connection

**Files:**
- Modify: `simulator/app.js`
- Modify: `host/test/simulator-assets.test.js`

- [ ] **Step 1: Write failing simulator asset tests**

Extend `host/test/simulator-assets.test.js` to assert:

- `EventSource` is used.
- `http://localhost:8787/v1/stream` appears.
- `POST` and `/v1/events` appear.
- `applyBridgeSnapshot` and `fallbackToLocal` appear.

- [ ] **Step 2: Run simulator asset tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/simulator-assets.test.js
```

Expected: FAIL until simulator bridge connection code exists.

- [ ] **Step 3: Implement simulator connection**

Change `simulator/app.js` so:

- It opens `new EventSource('http://localhost:8787/v1/stream')`.
- Incoming `slots` events call `applyBridgeSnapshot(snapshot)` and render.
- Manual controls call `POST /v1/events` when the bridge is connected.
- Failed connection or failed POST calls `fallbackToLocal()`.
- Existing manual behavior remains available offline.

- [ ] **Step 4: Run simulator asset tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/simulator-assets.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit simulator connection**

```bash
git add simulator/app.js host/test/simulator-assets.test.js
git commit -m "feat: connect simulator to host bridge"
```

## Task 5: Final Verification And Progress Record

**Files:**
- Modify: `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`

- [ ] **Step 1: Record progress checkpoint**

Add a Host Bridge checkpoint with the accepted API and simulator fallback behavior.

- [ ] **Step 2: Run full tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Check whitespace and status**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended files modified.

- [ ] **Step 4: Commit progress record**

```bash
git add docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md
git commit -m "docs: record host bridge milestone"
```

- [ ] **Step 5: Push checkpoint**

Run:

```bash
git push origin feature/local-simulation-foundation
```

Expected: branch pushes successfully.

## Self-Review

- Spec coverage:
  - `POST /v1/events`: Task 2.
  - `GET /v1/slots`: Task 2.
  - `GET /v1/stream`: Task 2.
  - Manual demo client: Task 3.
  - Simulator fallback: Task 4.
  - Progress recording: Task 5.
- Placeholder scan: no incomplete implementation slots remain.
- Type consistency:
  - External payload remains `session_id`.
  - Internal model remains `sessionId`.
  - Public snapshot uses `id` for simulator compatibility.
