# Adapter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable local event client and CLI so future AI-tool adapters can send normalized session events to the Host Bridge.

**Architecture:** `event-client` owns HTTP delivery to `POST /v1/events`; `event-cli` maps friendly commands to normalized payloads and calls the client. Documentation defines the adapter contract so future Codex, Claude, Cursor, and local-agent integrations share one event surface.

**Tech Stack:** JavaScript ES modules, Node built-in `node:test`, Node built-in `fetch`, dependency-free CLI parsing, Markdown docs.

---

## File Structure

- Create `host/src/event-client.js`: exports `sendEvent()` and `DEFAULT_BRIDGE_URL`.
- Create `host/src/event-cli.js`: exports argument parsing helpers and runs as a CLI.
- Create `host/test/event-client.test.js`: tests successful POST and error surfacing against the real Host Bridge server.
- Create `host/test/event-cli.test.js`: tests friendly command mapping and required argument validation.
- Create `docs/adapters/contract.md`: documents normalized event payloads and CLI examples.
- Modify `host/test/host-commands.test.js`: asserts `package.json` exposes the `event` command and CLI files contain expected hooks.
- Modify `host/test/docs.test.js`: asserts adapter contract contains required fields and supported events.
- Modify `package.json`: adds `event` script.
- Modify `README.md`: adds adapter CLI examples.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: records Adapter Foundation progress.

## Task 1: Event Client

**Files:**
- Create: `host/src/event-client.js`
- Test: `host/test/event-client.test.js`

- [ ] **Step 1: Write failing event client tests**

Create tests for:

- `sendEvent(payload, { baseUrl })` posts to `/v1/events` and returns the Host Bridge snapshot.
- `sendEvent()` throws an error containing the Host Bridge rejection message when the server returns 400.

- [ ] **Step 2: Run event client tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/event-client.test.js
```

Expected: FAIL because `host/src/event-client.js` does not exist.

- [ ] **Step 3: Implement event client**

Create `DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8787'` and `sendEvent(payload, options)`.

`sendEvent` must:

- Use `fetch` by default.
- POST JSON to `${baseUrl}/v1/events`.
- Return parsed JSON on success.
- Throw a readable error on non-2xx responses.

- [ ] **Step 4: Run event client tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/event-client.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit event client**

```bash
git add host/src/event-client.js host/test/event-client.test.js
git commit -m "feat: add host bridge event client"
```

## Task 2: Event CLI

**Files:**
- Create: `host/src/event-cli.js`
- Test: `host/test/event-cli.test.js`
- Modify: `host/test/host-commands.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing CLI tests**

Create tests for:

- `started --id s1 --source codex --title Build` maps to `event: 'started'` and `state: 'running'`.
- `approval --id s1` maps to `event: 'state_changed'` and `state: 'approval'`.
- `done --id s1` maps to `event: 'ended'` and `outcome: 'success'`.
- `error --id s1` maps to `event: 'ended'` and `outcome: 'error'`.
- `cleared --id s1` maps to `event: 'cleared'`.
- Missing `--id` throws a readable error.

- [ ] **Step 2: Run CLI tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/event-cli.test.js
```

Expected: FAIL because `host/src/event-cli.js` does not exist.

- [ ] **Step 3: Implement CLI parser and runner**

Create:

- `parseEventCliArgs(args)`.
- `buildPayload(command, flags)`.
- `runEventCli(args)`.

The script should run `runEventCli(process.argv.slice(2))` when invoked directly.

- [ ] **Step 4: Add package command asset coverage**

Update `package.json`:

```json
"event": "node host/src/event-cli.js"
```

Update `host/test/host-commands.test.js` to assert this script exists.

- [ ] **Step 5: Run CLI and command tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/event-cli.test.js host/test/host-commands.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit CLI**

```bash
git add host/src/event-cli.js host/test/event-cli.test.js host/test/host-commands.test.js package.json
git commit -m "feat: add adapter event CLI"
```

## Task 3: Adapter Contract And README

**Files:**
- Create: `docs/adapters/contract.md`
- Modify: `host/test/docs.test.js`
- Modify: `README.md`
- Modify: `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`

- [ ] **Step 1: Write failing docs tests**

Extend docs tests to assert:

- `docs/adapters/contract.md` exists.
- It contains `session_id`, `source`, `started`, `state_changed`, `ended`, and `cleared`.
- It contains an `event-cli.js started` example.

- [ ] **Step 2: Run docs tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: FAIL until the contract exists.

- [ ] **Step 3: Create adapter contract**

Document the normalized payload, supported commands, event mapping, ID guidance, and copy-paste CLI examples.

- [ ] **Step 4: Update README and progress log**

Add a short section with event CLI examples and record the Adapter Foundation checkpoint.

- [ ] **Step 5: Run docs tests to verify they pass**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit docs**

```bash
git add docs/adapters/contract.md host/test/docs.test.js README.md docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md
git commit -m "docs: add adapter contract"
```

## Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Run a local end-to-end event CLI check**

Start a temporary Host Bridge, send an event through `host/src/event-cli.js`, then read `/v1/slots`.

Expected: slot 6 contains the event CLI session ID.

- [ ] **Step 4: Push branch**

Run:

```bash
git push origin feature/local-simulation-foundation
```

Expected: branch pushes successfully.

## Self-Review

- Spec coverage:
  - Reusable event client: Task 1.
  - CLI event sender: Task 2.
  - Adapter contract: Task 3.
  - README examples: Task 3.
  - Verification: Task 4.
- Placeholder scan: no incomplete implementation slots remain.
- Type consistency:
  - External payload uses `session_id`.
  - CLI flag uses `--id`.
  - Default Host Bridge URL is `http://127.0.0.1:8787`.
