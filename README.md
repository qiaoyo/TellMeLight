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

Generate the Rev A2 pinout/JLC order package and KiCad baseline:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-order-package.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-kicad.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/package-rev-a2-jlc.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-preview.mjs
```

The Rev A2 JLC quote/review bundle is generated at `hardware/outputs/rev_a2/jlc_upload/`.
Use `tellmelight_rev_a2_jlc_gerber_drill.zip` for PCB quote upload practice and
`tellmelight_rev_a2_jlc_assembly_bom_cpl.zip` for SMT BOM/CPL matching practice. The bundle is
explicitly `NOT_FOR_ORDER` until the JLC orientation preview is manually checked.
The static Rev A2 hardware preview is `hardware/outputs/rev_a2/preview.html`.

Generate the Rev A3 machine-readable pin-level netlist:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a3-pin-netlist.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a3-symbols.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/lint-rev-a3-netlist.mjs
```

The Rev A3 netlist foundation lives at `hardware/netlists/rev_a3_pin_netlist.json`,
`hardware/netlists/rev_a3_pin_netlist.csv`, and
`hardware/notes/rev-a3-pin-level-schematic-feasibility.md`.
The Rev A3 local KiCad symbols live at `hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym`
with a symbol-upgrade validation log at `hardware/outputs/rev_a3/symbol-upgrade-check.log`.
The Rev A3 netlist lint report lives at `hardware/outputs/rev_a3/netlist-lint.json` and
`hardware/notes/rev-a3-netlist-lint.md`.
The Rev A3 protection decisions and tonight's JLC checklist live at
`hardware/notes/rev-a3-protection-decisions.md` and
`hardware/notes/rev-a3-jlc-tonight-checklist.md`.

Run KiCad CLI checks with the installed Windows KiCad 10.0 path:

```powershell
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a/erc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a/drc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a1/erc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a1/drc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a2/erc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a2/drc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
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
- Rev A2 pin-level review package with JLC BOM/CPL drafts, corrected USB ESD footprint direction, local TUOZHAN RGB LED footprint mapping, and circuit explanation notes.
- Rev A2 JLC upload review bundle with Gerber/drill zip, BOM/CPL zip, checksum manifest, and ordering blockers kept beside the quote files.
- Rev A2 static hardware preview page linking renders, JLC upload bundle, and Rev A3 readiness artifacts.
- Rev A3 machine-readable pin-level netlist foundation for the next real KiCad schematic draft.
- Rev A3 local KiCad symbol library for LP5024RSMR and the exact TUOZHAN S4-3528RGBTA-A RGB LED.
- Rev A3 netlist lint that checks required nets, expected single-pin review nets, and the VLED source-model review item before schematic generation.
- Rev A3 protection update with VLED TVS, explicit VBUS-to-VLED source link, USB-C shell `1M // 10nF` RC grounding, and a JLC checklist for quote/matcher validation.

## Out Of Scope For Milestone 1

- Real USB HID writer.
- Firmware build.
- Fabrication-ready schematic signoff, final routing, enclosure CAD, and optical validation.
- Tool-specific log parsers for Codex, Claude, Cursor, or other AI tools.

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/specs/2026-05-30-rev-a-kicad-hardware-design.md`
- `docs/superpowers/specs/2026-05-30-rev-a1-jlc-fabrication-candidate-design.md`
- `docs/superpowers/specs/2026-05-30-rev-a2-pinout-jlc-order-package-design.md`
- `docs/superpowers/specs/2026-05-29-adapter-foundation-design.md`
- `docs/adapters/contract.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
- `docs/superpowers/plans/2026-05-29-local-simulation-foundation.md`
- `docs/superpowers/plans/2026-05-30-rev-a-kicad-hardware.md`
- `docs/superpowers/plans/2026-05-30-rev-a1-jlc-fabrication-candidate.md`
- `docs/superpowers/plans/2026-05-30-rev-a2-pinout-jlc-order-package.md`
- `docs/superpowers/plans/2026-05-30-rev-a3-pin-level-schematic.md`
