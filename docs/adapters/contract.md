# TellMeLight Adapter Contract

TellMeLight adapters translate tool-specific activity into normalized local events for the Host Bridge.

Adapters do not own FIFO ordering, LED state rendering, USB output, or simulator behavior. They only send events to:

```text
POST http://127.0.0.1:8787/v1/events
```

## Required Fields

Every event payload must include:

- `source`: the adapter or tool name, such as `codex`, `claude`, `cursor`, or `manual`.
- `session_id`: a stable ID for one AI session.
- `event`: one of `started`, `state_changed`, `ended`, or `cleared`.

Optional fields:

- `state`: one of `running`, `approval`, `done`, or `error`.
- `title`: a human-readable label for the session.
- `time`: adapter-supplied timestamp string.
- `outcome`: for `ended`, one of `success`, `done`, or `error`.

## Event Semantics

- `started`
  - Creates or updates a visible session.
  - Defaults to `running`.
- `state_changed`
  - Updates an existing session in place.
  - Unknown sessions are inserted as new visible sessions.
- `ended`
  - Keeps the session visible.
  - `outcome: "success"` or `outcome: "done"` maps to `done`.
  - `outcome: "error"` maps to `error`.
- `cleared`
  - Removes the visible session and compacts later sessions left.

## Payload Example

```json
{
  "source": "codex",
  "session_id": "codex-1",
  "event": "started",
  "state": "running",
  "title": "Implement firmware"
}
```

## CLI Examples

Start a session:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js started --id codex-1 --source codex --title "Implement firmware"
```

Mark it as waiting for approval:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js approval --id codex-1 --source codex
```

Mark it done:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js done --id codex-1 --source codex
```

Mark it errored:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js error --id codex-1 --source codex
```

Clear it:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js cleared --id codex-1 --source codex
```

Use a non-default Host Bridge URL:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js started --id local-1 --url http://127.0.0.1:9000
```

## Session ID Guidance

Use stable session IDs. If a tool does not provide one, derive an ID from:

- workspace path,
- adapter name,
- process ID,
- or a local session counter.

Avoid using only a timestamp when the same session will emit multiple events.
