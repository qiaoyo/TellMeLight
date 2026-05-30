# TellMeLight Rev A1 KiCad Project

Generated: 2026-05-30

## Contents

- `tellmelight_rev_a1.kicad_pro`: KiCad project.
- `tellmelight_rev_a1.kicad_sch`: block-level schematic/net plan for Rev A1.
- `tellmelight_rev_a1.kicad_sym` and `sym-lib-table`: local symbols so KiCad can export a review BOM.
- `tellmelight_rev_a1.kicad_pcb`: 4-layer PCB floorplan with stock KiCad footprints.

## Important Boundary

This is a Rev A1 JLC-oriented CAD baseline for review. It is not a fabrication release until the pin-by-pin schematic, routing, footprint models, JLC BOM matching, and DFM are reviewed.

## Manufacturing Direction

- 4-layer PCB.
- Double-sided SMT assembly.
- No assumed user hand-soldering.
- Pogo/test pads replace the visible SWD header direction.
- Front side is kept mostly optical; back side carries logic, USB, power, and service controls.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
