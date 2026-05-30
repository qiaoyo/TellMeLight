# Windows Codex Integration Design

Date: 2026-05-30

## Goal

Connect TellMeLight directly to the local Windows Codex CLI conversation/session flow.

This is not a generic process wrapper. It uses real `codex exec --json` and `codex exec resume --json` output so TellMeLight can key sessions by Codex `thread_id`.

## Verified Local Codex

- Executable: `codex.exe`
- Version: `codex-cli 0.133.0-alpha.1`
- Install path: VS Code ChatGPT extension Windows binary.
- Working network path: proxy `http://127.0.0.1:7892`.
- Verified request:
  - Command: `codex exec --json -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"`
  - Observed `thread.started` with a real `thread_id`.
  - Observed final agent message `TellMeLight codex smoke ok`.

## Scope

Included:

- `tml-codex` command for new Codex turns.
- `tml-codex resume` command for continuing a recorded Codex session.
- Real Codex JSONL parsing.
- TellMeLight session ID from Codex `thread_id`.
- Running/done/error mapping from Codex turn and process lifecycle.
- Approval mapping when Codex JSONL contains approval-oriented event or item status fields.
- Proxy override through `--tml-proxy` or `TELLMELIGHT_CODEX_PROXY`.

Excluded:

- Interactive TUI scraping.
- Private Codex database parsing.
- Mutating Codex config files.
- Firmware, HID output, PCB, and schematic work.

## Command Shape

New request:

```powershell
$env:TELLMELIGHT_CODEX_PROXY = "http://127.0.0.1:7892"
$node = powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -Eval "console.log(process.execPath)"
& $node host/src/codex-cli.js exec -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"
```

Resume most recent non-interactive Codex session:

```powershell
& $node host/src/codex-cli.js resume --last "Continue the previous TellMeLight test"
```

TellMeLight-only flags:

- `--tml-url`: Host Bridge base URL.
- `--tml-title`: visible title before Codex emits details.
- `--tml-proxy`: proxy URL assigned to `HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy`, and `https_proxy` for the Codex child process.

## Event Mapping

- `thread.started`: send TellMeLight `started` with `state: running` and `session_id` equal to the Codex thread ID.
- `turn.started`: send `state_changed` to `running` if the thread is known.
- JSONL event or item fields containing approval/waiting-for-approval semantics: send `state_changed` to `approval`.
- `turn.completed`: send `ended` with `outcome: success`.
- Codex JSONL error events or non-zero process exit: send `ended` with `outcome: error`.

The CLI passes Codex stdout/stderr through so it remains usable as a Codex command.

## Testing

Unit tests cover command parsing, proxy environment application, JSONL event mapping, and process lifecycle behavior with fake spawn/send functions.

Real smoke test uses the local Windows Codex CLI with proxy `http://127.0.0.1:7892` and a temporary Host Bridge.
