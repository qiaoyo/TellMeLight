# TellMeLight Process Adapter Design

Date: 2026-05-30

## Goal

Add a generic local process wrapper that can run any AI CLI or script while automatically reporting lifecycle events to the Host Bridge.

This is the first real adapter MVP: it connects TellMeLight to local work without depending on private Codex, Claude, Cursor, or editor internals.

## Scope

Included:

- A reusable process runner that emits TellMeLight events around a child process.
- A dependency-free CLI wrapper.
- Command examples for wrapping any local tool.
- Tests for event ordering, exit-code mapping, argument parsing, and command passthrough.

Excluded:

- Parsing specific AI tool logs.
- Detecting approval-needed state from command output.
- Long-running daemon supervision.
- Shell-specific command composition.
- Firmware, USB HID writing, and PCB work.

## Command Shape

Primary invocation:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/process-cli.js --source codex --id codex-test --title "Codex test" -- codex --help
```

Flags:

- `--source`: optional, defaults to `process`.
- `--id`: optional; if omitted, the wrapper generates a session ID.
- `--title`: optional; if omitted, the title is derived from the wrapped command.
- `--url`: optional Host Bridge base URL.
- `--cwd`: optional working directory for the child process.

Everything after `--` is the command and its arguments. The wrapper does not use a shell by default; it passes arguments directly to `child_process.spawn`.

## Event Behavior

Before launching the command:

- Send `started` with `state: "running"`.

After the child exits:

- Exit code `0`: send `ended` with `outcome: "success"`.
- Non-zero exit code: send `ended` with `outcome: "error"`.
- Spawn failure: send `ended` with `outcome: "error"` and return exit code `1`.

If the Host Bridge is unavailable:

- Print a warning to stderr.
- Continue running the wrapped command.
- Preserve the wrapped command exit code.

## Output Behavior

The wrapper must pass child stdout and stderr through to the parent process. It should not buffer, rewrite, or decorate the child output.

## Testing

Tests cover:

- Started event is sent before the child process is spawned.
- Exit code `0` maps to done/success.
- Non-zero exit code maps to error.
- Event send failures do not block command execution.
- CLI parser requires the `--` command separator.
- CLI parser supports `--source`, `--id`, `--title`, `--url`, and auto-generated IDs.

Full verification remains:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```
