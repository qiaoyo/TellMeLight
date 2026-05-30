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

## Process Wrapper

`host/src/process-cli.js` is the generic local process adapter. Use it when a tool can be represented as a command that starts, runs, and exits. The wrapper emits:

- `started` before launching the child process.
- `ended` with `outcome: "success"` when the child exits with code `0`.
- `ended` with `outcome: "error"` when the child exits non-zero or cannot be spawned.

The wrapper preserves the child process exit code. TellMeLight event delivery failures are printed as warnings and do not block the wrapped command.

Wrapper flags must come before `--`. Everything after `--` is treated as the child command and its arguments:

```powershell
$node = powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -Eval "console.log(process.execPath)"
& $node host/src/process-cli.js --source codex --id codex-1 --title "Codex run" -- codex --help
```

The package script name is `tml-run` for environments with `npm` available:

```powershell
npm run tml-run -- --source smoke --id process-smoke -- powershell -NoProfile -Command "exit 0"
```

Useful flags:

- `--source`: adapter or tool name; defaults to `process`.
- `--id`: stable session ID; generated when omitted.
- `--title`: visible session label; defaults to the child command line.
- `--url`: non-default Host Bridge URL.
- `--cwd`: child process working directory.

## Windows Codex Adapter

`host/src/codex-cli.js` is the direct Windows Codex adapter. It runs the local `codex` executable in JSONL mode and uses Codex's real `thread_id` as the TellMeLight `session_id`.

New Codex request:

```powershell
$env:TELLMELIGHT_CODEX_PROXY = "http://127.0.0.1:7892"
$node = powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -Eval "console.log(process.execPath)"
& $node host/src/codex-cli.js exec -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"
```

Resume the latest recorded Codex session:

```powershell
& $node host/src/codex-cli.js resume --last "Continue the previous TellMeLight test"
```

The package script name is `tml-codex` for environments with `npm` available:

```powershell
npm run tml-codex -- exec -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"
```

TellMeLight-only flags:

- `--tml-url`: non-default Host Bridge URL.
- `--tml-title`: visible session label.
- `--tml-proxy`: proxy URL for the Codex child process.

Event mapping:

- Codex `thread.started` sends `started` with `state: running`.
- Codex `turn.started` sends `state_changed` to `running`.
- Approval-like Codex event or item statuses send `state_changed` to `approval`.
- Codex `turn.completed` sends `ended` with `outcome: success`.
- Codex error events or non-zero process exit send `ended` with `outcome: error`.

## Session ID Guidance

Use stable session IDs. If a tool does not provide one, derive an ID from:

- workspace path,
- adapter name,
- process ID,
- or a local session counter.

Avoid using only a timestamp when the same session will emit multiple events.
