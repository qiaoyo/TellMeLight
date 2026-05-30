# TellMeLight Rev A3 KiCad Project

Generated: 2026-05-31

## Contents

- `tellmelight_rev_a3.kicad_pro`: KiCad project.
- `tellmelight_rev_a3.kicad_sch`: Rev A3 review schematic/net plan inherited from Rev A2 and marked for A3.
- `tellmelight_rev_a3.kicad_sym`: TellMeLight Rev A3 local symbols for LP5024 and the TUOZHAN RGB LED, created in the Rev A3 symbol checkpoint.
- `tellmelight_rev_a3_review.kicad_sym`: Rev A3 generic review symbols for the inherited block-level schematic.
- `tellmelight_rev_a3.kicad_pcb`: 76 mm x 56 mm 4-layer PCB candidate.
- `tellmelight_rev_a3.pretty/`: local TUOZHAN RGB LED footprint.

## Rev A3 Changes From Rev A2

- Board outline is reduced from 96 mm x 74 mm to 76 mm x 56 mm.
- U6 `TPD1E05U06DPY` adds VLED-to-GND TVS/ESD protection.
- R10 `0R` explicitly ties VBUS to VLED.
- R9 `1M` and C17 `10nF` implement the USB-C shell-to-GND RC network.
- Top silkscreen includes a small A1-style separated avatar watermark in an empty optical-face area.
- Top silkscreen title includes the persistent `By Joey.qiao` attribution.
- The JLC package is an order-review candidate, but payment is still blocked until the JLC orientation preview is checked.

## Important Boundary

Rev A3 is a compact JLC order-review package for board size, SMT matching, placement, orientation, and silkscreen review. It is not yet the paid-order electrical routing release. The functional routed PCB remains the next hardware step after this package is checked in JLC.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
- The A1-style separated avatar watermark sits near the upper top-side empty area and avoids SMT pads.
