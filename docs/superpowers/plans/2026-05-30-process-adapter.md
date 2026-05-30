# Process Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic process wrapper that runs any local command while reporting started, done, and error events to the Host Bridge.

**Architecture:** `process-runner` owns child process execution and event ordering; `process-cli` parses wrapper flags and delegates to the runner. The existing `event-client` remains the only HTTP delivery layer, and Host Bridge remains the owner of validation and FIFO state.

**Tech Stack:** JavaScript ES modules, Node built-in `child_process`, Node built-in `node:test`, dependency-free CLI parsing, Markdown docs.

---

## File Structure

- Create `host/src/process-runner.js`: exports `runProcessWithEvents()` and child-process event mapping helpers.
- Create `host/src/process-cli.js`: exports `parseProcessCliArgs()` and runs as a CLI.
- Create `host/test/process-runner.test.js`: tests event ordering, exit-code mapping, and event-send failure behavior with fake spawn/send functions.
- Create `host/test/process-cli.test.js`: tests CLI parsing, `--` separator handling, and auto ID behavior.
- Modify `host/test/host-commands.test.js`: asserts package exposes the process wrapper command and script assets exist.
- Modify `host/test/docs.test.js`: asserts process adapter docs exist.
- Modify `package.json`: adds `tml-run` script.
- Modify `README.md`: adds process wrapper examples.
- Modify `docs/adapters/contract.md`: adds process wrapper section.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: records Process Adapter checkpoint.

## Task 1: Process Runner Core

**Files:**
- Create: `host/src/process-runner.js`
- Test: `host/test/process-runner.test.js`

- [ ] **Step 1: Write failing runner tests**

Create tests for:

- Sends `started` before spawning the child process.
- Sends `ended` with `outcome: "success"` when exit code is `0`.
- Sends `ended` with `outcome: "error"` when exit code is non-zero.
- Continues to spawn and returns the child exit code when the initial TellMeLight event send fails.

- [ ] **Step 2: Run runner tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/process-runner.test.js
```

Expected: FAIL because `host/src/process-runner.js` does not exist.

- [ ] **Step 3: Implement runner**

Create `runProcessWithEvents(options)`.

It must accept:

- `command`
- `args`
- `sessionId`
- `source`
- `title`
- `baseUrl`
- optional `sendEventImpl`
- optional `spawnImpl`
- optional `stdio`

It must return the child exit code.

- [ ] **Step 4: Run runner tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/process-runner.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit runner**

```bash
git add host/src/process-runner.js host/test/process-runner.test.js
git commit -m "feat: add generic process runner"
```

## Task 2: Process CLI

**Files:**
- Create: `host/src/process-cli.js`
- Test: `host/test/process-cli.test.js`
- Modify: `host/test/host-commands.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing CLI tests**

Create tests for:

- Parses `--source codex --id s1 --title Build -- echo ok`.
- Uses `process` as default source.
- Generates a session ID when `--id` is omitted.
- Uses the command as default title when `--title` is omitted.
- Throws when `--` separator is missing.
- Throws when no command follows `--`.

- [ ] **Step 2: Run CLI tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/process-cli.test.js
```

Expected: FAIL because `host/src/process-cli.js` does not exist.

- [ ] **Step 3: Implement CLI**

Create:

- `parseProcessCliArgs(args, options)`
- `runProcessCli(args)`

Add package script:

```json
"tml-run": "node host/src/process-cli.js"
```

- [ ] **Step 4: Run CLI and asset tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/process-cli.test.js host/test/host-commands.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit CLI**

```bash
git add host/src/process-cli.js host/test/process-cli.test.js host/test/host-commands.test.js package.json
git commit -m "feat: add process adapter CLI"
```

## Task 3: Documentation And Progress

**Files:**
- Modify: `docs/adapters/contract.md`
- Modify: `README.md`
- Modify: `host/test/docs.test.js`
- Modify: `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`

- [ ] **Step 1: Write failing docs tests**

Extend docs tests to assert:

- `docs/adapters/contract.md` mentions `process-cli.js`.
- It contains `tml-run`.
- It contains `--source`, `--id`, and `--`.

- [ ] **Step 2: Run docs tests to verify they fail**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: FAIL until docs are updated.

- [ ] **Step 3: Update docs**

Add process wrapper examples to README and adapter contract. Record the Process Adapter checkpoint in the Superpowers progress log.

- [ ] **Step 4: Run docs tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/docs.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit docs**

```bash
git add docs/adapters/contract.md README.md host/test/docs.test.js docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md
git commit -m "docs: document process adapter"
```

## Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full tests**

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

- [ ] **Step 3: Run local process wrapper smoke test**

Start a temporary Host Bridge, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/process-cli.js --source smoke --id process-smoke --title "Process smoke" -- powershell -Command "exit 0"
```

Expected: command exits `0` and `/v1/slots` contains `process-smoke` as done.

- [ ] **Step 4: Push branch**

Run:

```bash
git push origin feature/local-simulation-foundation
```

Expected: branch pushes successfully.

## Self-Review

- Spec coverage:
  - Started before command: Task 1.
  - Done/error by exit code: Task 1.
  - Event-send failure is non-blocking: Task 1.
  - CLI flags and `--` separator: Task 2.
  - README and adapter contract examples: Task 3.
- Placeholder scan: no incomplete implementation slots remain.
- Type consistency:
  - CLI flag uses `--id`.
  - Event payload uses `session_id`.
  - Default source is `process`.
