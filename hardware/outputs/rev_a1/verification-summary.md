# Rev A1 Verification Summary

Date: 2026-05-30

## Generated Artifacts

- KiCad project: `hardware/kicad/tellmelight_rev_a1/`
- Manual BOM: `hardware/bom/rev_a1_bom.csv`
- JLC sourcing table: `hardware/bom/rev_a1_jlc_sourcing.csv`
- JLC readiness note: `hardware/notes/rev-a1-jlc-readiness.md`
- Power budget: `hardware/simulation/rev_a1_power_budget.md`
- Outputs: `hardware/outputs/rev_a1/`

## Commands Run

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a1-kicad.mjs
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a1-assets.test.js
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a1/erc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export bom -o hardware/outputs/rev_a1/bom_from_kicad.csv hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export netlist -o hardware/outputs/rev_a1/netlist.xml hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a1/drc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export gerbers -o hardware/outputs/rev_a1/gerbers hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export drill -o hardware/outputs/rev_a1/drill hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export pos -o hardware/outputs/rev_a1/pos hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export step -o hardware/outputs/rev_a1/tellmelight_rev_a1.step hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export pdf -o hardware/outputs/rev_a1/tellmelight_rev_a1_pcb.pdf --layers F.Cu,In1.Cu,In2.Cu,B.Cu,F.Silkscreen,B.Silkscreen,Edge.Cuts --mode-multipage --scale 0 hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export svg -o hardware/outputs/rev_a1/tellmelight_rev_a1_pcb_top.svg --layers F.Cu,F.Silkscreen,Edge.Cuts --mode-single --fit-page-to-board hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export svg -o hardware/outputs/rev_a1/tellmelight_rev_a1_pcb_bottom.svg --layers B.Cu,B.Silkscreen,Edge.Cuts --mode-single --fit-page-to-board --mirror hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a1/tellmelight_rev_a1_top.png --side top --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a1/tellmelight_rev_a1_bottom.png --side bottom --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe sch export pdf -o hardware/outputs/rev_a1/tellmelight_rev_a1_schematic.pdf hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export svg -o hardware/outputs/rev_a1/schematic_svg hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
```

## Results

- Rev A1 asset tests: 4 passed, 0 failed.
- KiCad ERC: 0 violations.
- KiCad DRC: 0 violations and 0 unconnected items.
- Gerbers, drill, position, PDF, SVG, top render, bottom render, schematic PDF, and schematic SVG exported successfully.
- STEP export succeeded.

## Warnings

- STEP export reported missing stock 3D models for:
  - `U2` VQFN-32 LP5024 footprint.
  - `J1` HRO USB-C footprint.
- This is not a PCB fabrication blocker, but it is a mechanical review item before enclosure work.

## Remaining Order Blockers

- The schematic is still a block-level net plan with review symbols, not a pin-by-pin fabrication schematic.
- RGB LED pinout must be verified against the final JLC selected part before ordering.
- USB-C footprint, shell grounding, and connector mechanical fit need review.
- LP5024 exposed-pad stencil and paste-windowing need review.
- JLC BOM/CPL upload must be checked in the order UI before spending money.
