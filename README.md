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

## Design Docs

- [Design spec](docs/superpowers/specs/2026-05-29-tellmelight-design.md)
- [Progress log](docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md)
