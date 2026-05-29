# TellMeLight

TellMeLight is a USB-connected AI hardware design for visualizing local AI sessions as a persistent six-slot light queue.

Current milestone: local software simulation only. No real PCB or USB device is required.

## Local Commands

Run all tests on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Open the static simulator:

```text
simulator/index.html
```

## Milestone 1 Contents

- FIFO session model.
- Local API event schema.
- HID display frame encoder.
- Browser simulator.
- Hardware architecture notes.
- Decision record that blocks PCB layout until simulation is testable.

## Design Docs

- `docs/superpowers/specs/2026-05-29-tellmelight-design.md`
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`
- `docs/superpowers/plans/2026-05-29-local-simulation-foundation.md`
