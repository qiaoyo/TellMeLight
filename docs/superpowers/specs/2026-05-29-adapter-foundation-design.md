# TellMeLight Adapter Foundation Design

Date: 2026-05-29

## Goal

Create a stable local event-sending layer so any AI tool, wrapper script, or future adapter can report session lifecycle changes to the Host Bridge without knowing simulator or hardware details.

## Scope

Included:

- A small reusable event client for `POST /v1/events`.
- A dependency-free CLI for manual and scripted event sending.
- A documented adapter contract for future Codex, Claude, Cursor, and local-agent integrations.
- README examples that can be copied into local scripts.

Excluded:

- Parsing real Codex, Claude, Cursor, or editor logs.
- Background process monitoring.
- Authentication, remote networking, or cloud service integration.
- Changes to Host Bridge FIFO behavior.

## Architecture

Adapters should only produce normalized TellMeLight events. The new event client owns HTTP delivery to the Host Bridge, while the Host Bridge remains the only owner of validation, FIFO ordering, and streaming.

The CLI is a thin wrapper over the event client:

- `started` sends a `started` event with default `running` state.
- `running` and `approval` send `state_changed`.
- `done` sends `ended` with `outcome: "success"`.
- `error` sends `ended` with `outcome: "error"`.
- `cleared` sends `cleared`.

This keeps tool-specific adapters disposable. A future Codex adapter can either call the CLI or import the event client.

## CLI Shape

Default Host Bridge URL:

```text
http://127.0.0.1:8787
```

Examples:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js started --id codex-1 --source codex --title "Implement firmware"
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js approval --id codex-1 --source codex
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js done --id codex-1 --source codex
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js cleared --id codex-1 --source codex
```

Supported flags:

- `--id`: required, maps to `session_id`.
- `--source`: optional, defaults to `manual`.
- `--title`: optional.
- `--url`: optional Host Bridge base URL.
- `--time`: optional ISO-like timestamp string.

## Adapter Contract

An adapter must send JSON compatible with `POST /v1/events`:

```json
{
  "source": "codex",
  "session_id": "codex-1",
  "event": "started",
  "state": "running",
  "title": "Implement firmware"
}
```

Adapters should use stable session IDs. If a tool has no native ID, the adapter should derive one from the workspace path plus a local process/session identifier.

## Testing

Tests cover:

- Event client posts to `/v1/events` and returns the Host Bridge snapshot.
- Event client surfaces Host Bridge errors.
- CLI argument parsing maps friendly commands to normalized payloads.
- CLI script assets and package scripts exist.
- Adapter contract documentation contains required fields and supported events.

Full verification remains:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```
