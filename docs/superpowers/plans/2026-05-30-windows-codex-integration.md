# Windows Codex Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a direct Windows Codex CLI integration that maps real Codex JSONL session events to TellMeLight light states.

**Architecture:** `codex-event-mapper` turns Codex JSONL events into normalized TellMeLight payloads. `codex-runner` spawns the real `codex` executable, parses stdout line-by-line, sends events through the existing event client, and preserves Codex output. `codex-cli` owns TellMeLight-specific flags and Codex command argument construction.

**Tech Stack:** JavaScript ES modules, Node built-ins, Codex CLI `0.133.0-alpha.1`, Node `node:test`, existing Host Bridge event client.

---

## File Structure

- Create `host/src/codex-event-mapper.js`: maps parsed Codex JSONL objects to TellMeLight payloads.
- Create `host/src/codex-runner.js`: spawns Codex, streams JSONL, emits TellMeLight events.
- Create `host/src/codex-cli.js`: CLI entry for `tml-codex`.
- Create `host/test/codex-event-mapper.test.js`: tests thread, turn, approval, and error mapping.
- Create `host/test/codex-cli.test.js`: tests command parsing and proxy env.
- Create `host/test/codex-runner.test.js`: tests stream parsing and lifecycle using fake spawn/send.
- Modify `package.json`: adds `tml-codex`.
- Modify `host/test/host-commands.test.js`: asserts command is exposed.
- Modify `README.md` and `docs/adapters/contract.md`: document direct Codex usage.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record checkpoint.

## Task 1: Codex Event Mapper

- [ ] Write failing tests for `thread.started`, `turn.started`, approval-like item status, `turn.completed`, and error events.
- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/codex-event-mapper.test.js` and confirm failure.
- [ ] Implement `host/src/codex-event-mapper.js`.
- [ ] Re-run mapper tests and commit `feat: map codex json events`.

## Task 2: Codex CLI Parsing

- [ ] Write failing tests for `exec`, default exec, `resume`, `--tml-url`, `--tml-title`, and `--tml-proxy`.
- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/codex-cli.test.js host/test/host-commands.test.js` and confirm failure.
- [ ] Implement `host/src/codex-cli.js` and package script `tml-codex`.
- [ ] Re-run CLI tests and commit `feat: add tml codex cli`.

## Task 3: Codex Runner

- [ ] Write failing tests for parsing JSONL stdout, sending started on real `thread_id`, sending done on `turn.completed`, and sending error on non-zero exit.
- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/codex-runner.test.js` and confirm failure.
- [ ] Implement `host/src/codex-runner.js`.
- [ ] Re-run runner tests and commit `feat: run codex json sessions`.

## Task 4: Documentation And Progress

- [ ] Add direct Windows Codex examples and proxy guidance to README and adapter contract.
- [ ] Add docs tests that mention `codex-cli.js`, `tml-codex`, `thread_id`, and `TELLMELIGHT_CODEX_PROXY`.
- [ ] Record the Windows Codex checkpoint in the Superpowers progress log.
- [ ] Run docs tests and commit `docs: document windows codex integration`.

## Task 5: Final Verification

- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js`.
- [ ] Run `git diff --check`.
- [ ] Run a real local smoke test with `TELLMELIGHT_CODEX_PROXY=http://127.0.0.1:7892`, temporary Host Bridge, and `tml-codex exec`.
- [ ] Push `feature/local-simulation-foundation`.
