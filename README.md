# TellMeLight

TellMeLight is a USB-connected AI hardware design for visualizing local AI sessions as a persistent six-slot light queue.

Current milestone: local software simulation only. No real PCB or USB device is required.

## Local Commands

Run all tests on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Start the local Host Bridge:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/server-cli.js
```

Send a repeatable demo event sequence while the Host Bridge is running:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/demo-client.js
```

Send individual adapter-style events:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js started --id codex-1 --source codex --title "Implement firmware"
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js approval --id codex-1 --source codex
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 host/src/event-cli.js done --id codex-1 --source codex
```

Wrap a local command as a TellMeLight session:

```powershell
$node = powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -Eval "console.log(process.execPath)"
& $node host/src/process-cli.js --source codex --id codex-1 --title "Codex run" -- codex --help
& $node host/src/process-cli.js --source smoke --id process-smoke -- powershell -NoProfile -Command "exit 0"
```

Open the static simulator:

```text
simulator/index.html
```

## Simulator Interaction

- Click any of the six light slots to select it.
- Use `Set Running`, `Set Approval`, `Set Done`, or `Set Error` to update the selected session.
- Use `Clear Selected` to remove the selected visible session and compact later sessions left.
- `Add Running` appends a new running session on the newest/rightmost side.

## Milestone 1 Contents

- FIFO session model.
- Local API event schema.
- HID display frame encoder.
- Browser simulator.
- Hardware architecture notes.
- Generic process wrapper adapter.
- Decision record that blocks PCB layout until simulation is testable.

## Out Of Scope For Milestone 1

- Real USB HID writer.
- Firmware build.
- KiCad schematic or PCB layout.
- Tool-specific log parsers for Codex, Claude, Cursor, or other AI tools.

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/specs/2026-05-29-adapter-foundation-design.md`
- `docs/adapters/contract.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
- `docs/superpowers/plans/2026-05-29-local-simulation-foundation.md`
