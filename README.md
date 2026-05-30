# TellMeLight

TellMeLight is a USB-connected AI hardware design for visualizing local AI sessions as a persistent six-slot light queue.

Current milestone: local software simulation plus a Rev A KiCad hardware baseline. No physical PCB or USB device is required yet.

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

Run a real Windows Codex request as a TellMeLight session:

```powershell
$env:TELLMELIGHT_CODEX_PROXY = "http://127.0.0.1:7892"
$node = powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 -Eval "console.log(process.execPath)"
& $node host/src/codex-cli.js exec -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"
& $node host/src/codex-cli.js resume --last "Continue the previous TellMeLight test"
```

The package script for the same adapter is `tml-codex`.

Open the static simulator:

```text
simulator/index.html
```

Generate the Rev A KiCad hardware baseline:

```powershell
node tools/hardware/generate-rev-a-kicad.mjs
```

Generate the Rev A1 JLC-oriented hardware baseline:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a1-kicad.mjs
```

Run KiCad CLI checks with the installed Windows KiCad 10.0 path:

```powershell
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a/erc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a/drc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a1/erc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a1/drc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
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
- Direct Windows Codex JSON session adapter.
- Rev A KiCad hardware baseline with BOM, PCB floorplan, and power-budget simulation.
- Rev A1 JLC-oriented KiCad baseline with 4-layer PCB, JLC sourcing table, pogo/debug pads, and manufacturing readiness notes.

## Out Of Scope For Milestone 1

- Real USB HID writer.
- Firmware build.
- Fabrication-ready schematic signoff, final routing, enclosure CAD, and optical validation.
- Tool-specific log parsers for Codex, Claude, Cursor, or other AI tools.

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/specs/2026-05-30-rev-a-kicad-hardware-design.md`
- `docs/superpowers/specs/2026-05-30-rev-a1-jlc-fabrication-candidate-design.md`
- `docs/superpowers/specs/2026-05-29-adapter-foundation-design.md`
- `docs/adapters/contract.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
- `docs/superpowers/plans/2026-05-29-local-simulation-foundation.md`
- `docs/superpowers/plans/2026-05-30-rev-a-kicad-hardware.md`
- `docs/superpowers/plans/2026-05-30-rev-a1-jlc-fabrication-candidate.md`
