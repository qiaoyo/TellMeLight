# Rev A KiCad Hardware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verified Rev A KiCad hardware baseline for the integrated TellMeLight USB light device.

**Architecture:** A small Node generator writes deterministic hardware documentation, BOM tables, and KiCad project scaffolding. A KiCad Python generator uses the installed KiCad 10.0 `pcbnew` API to create the PCB with real library footprints and the approved six-zone/four-bar placement. KiCad CLI then runs ERC/DRC and exports review/manufacturing artifacts.

**Tech Stack:** KiCad 10.0.3 CLI, KiCad `pcbnew` Python API, JavaScript ES modules, Node `node:test`, PowerShell runner.

---

## File Structure

- Create `hardware/kicad/tellmelight_rev_a/`: KiCad project, schematic, board, local symbol metadata, and generated design README.
- Create `hardware/bom/rev_a_bom.csv`: human-readable baseline BOM.
- Create `hardware/simulation/rev_a_power_budget.csv`: machine-readable current budget.
- Create `hardware/simulation/rev_a_power_budget.md`: readable power simulation notes.
- Create `hardware/outputs/rev_a/`: ERC, DRC, and exported KiCad output files.
- Create `tools/hardware/generate-rev-a-kicad.mjs`: deterministic project/document generator.
- Create `tools/hardware/generate_rev_a_board.py`: KiCad `pcbnew` board generator.
- Create `host/test/hardware-assets.test.js`: repository tests for hardware outputs and decisions.
- Modify `hardware/notes/rev-a-architecture.md`: move from "no PCB" note to Rev A baseline note.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record this checkpoint.
- Modify `README.md`: add the hardware workspace and KiCad commands.

## Task 1: Spec And Plan

- [ ] Save the approved Rev A design spec at `docs/superpowers/specs/2026-05-30-rev-a-kicad-hardware-design.md`.
- [ ] Save this implementation plan at `docs/superpowers/plans/2026-05-30-rev-a-kicad-hardware.md`.
- [ ] Run `git diff --check`.
- [ ] Commit as `docs: plan rev a kicad hardware`.

## Task 2: Hardware Artifact Tests

- [ ] Add `host/test/hardware-assets.test.js`.
- [ ] Tests must assert the Rev A spec mentions `RP2040`, `LP5024`, `USB-C`, `six logical session slots`, and `VQFN-32`.
- [ ] Tests must assert the generated BOM contains `RP2040`, `LP5024`, `W25Q32`, `AP2112K`, `TPD2EUSB30`, `USB_C`, and `RGB_LED`.
- [ ] Tests must assert the generated PCB contains the required references `U1`, `U2`, `J1`, `D1` through `D6`, `SWD1`, `SW1`, and `SW2`.
- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-assets.test.js` and confirm the new tests fail before generation.

## Task 3: Generators And Documentation

- [ ] Add `tools/hardware/generate-rev-a-kicad.mjs` with deterministic output paths.
- [ ] Add `tools/hardware/generate_rev_a_board.py` that loads KiCad stock footprints and places the core Rev A components.
- [ ] Update `hardware/notes/rev-a-architecture.md` with the actual KiCad baseline scope.
- [ ] Update `README.md` with hardware commands and artifact paths.
- [ ] Update the Superpowers progress log with the Rev A hardware checkpoint.

## Task 4: Generate Rev A Assets

- [ ] Run `node tools/hardware/generate-rev-a-kicad.mjs`.
- [ ] Confirm these files are created:
  - `hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pro`
  - `hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch`
  - `hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`
  - `hardware/bom/rev_a_bom.csv`
  - `hardware/simulation/rev_a_power_budget.csv`
  - `hardware/simulation/rev_a_power_budget.md`
- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-assets.test.js` and confirm the hardware tests pass.

## Task 5: KiCad CLI Verification And Exports

- [ ] Run `E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a/erc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe sch export bom -o hardware/outputs/rev_a/bom_from_kicad.csv hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe sch export netlist -o hardware/outputs/rev_a/netlist.xml hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_sch`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a/drc.json hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb export gerbers -o hardware/outputs/rev_a/gerbers hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb export drill -o hardware/outputs/rev_a/drill hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb export pos -o hardware/outputs/rev_a/pos hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb export step -o hardware/outputs/rev_a/tellmelight_rev_a.step hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Run `E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a/tellmelight_rev_a_top.png --side top --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a/tellmelight_rev_a.kicad_pcb`.
- [ ] Record any warnings in `hardware/outputs/rev_a/verification-summary.md`.

## Task 6: Final Repository Verification

- [ ] Run `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js`.
- [ ] Run `git diff --check`.
- [ ] Review `git status --short`.
- [ ] Commit as `feat: add rev a kicad hardware baseline`.
- [ ] Push `feature/local-simulation-foundation`.
