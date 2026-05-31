# TellMeLight Rev A4 KiCad Project

Generated: 2026-05-31

## Contents

- `tellmelight_rev_a4.kicad_pro`: KiCad project.
- `tellmelight_rev_a4.kicad_sch`: Rev A4 review schematic/net plan inherited from Rev A2 and marked for A4.
- `tellmelight_rev_a4.kicad_sym`: TellMeLight Rev A4 local symbols for LP5024 and the TUOZHAN RGB LED, created in the Rev A4 symbol checkpoint.
- `tellmelight_rev_a4_review.kicad_sym`: Rev A4 generic review symbols for the inherited block-level schematic.
- `tellmelight_rev_a4.kicad_pcb`: 76 mm x 56 mm 4-layer routing candidate.
- `tellmelight_rev_a4.pretty/`: local TUOZHAN RGB LED footprint.

## Rev A4 Changes From Rev A2

- Board outline is reduced from 96 mm x 74 mm to 76 mm x 56 mm.
- U6 `TPD1E05U06DPY` adds VLED-to-GND TVS/ESD protection.
- R10 `0R` explicitly ties VBUS to VLED.
- R9 `1M` and C17 `10nF` implement the USB-C shell-to-GND RC network.
- C18 `1uF` adds the required RP2040 VREG_VOUT local capacitor.
- Top silkscreen includes a small A1-style separated avatar watermark in an empty optical-face area.
- Top silkscreen title includes the persistent `By Joey.qiao` attribution.
- The JLC package is a preview candidate; payment is blocked until JLC DFM and orientation preview are checked.

## Important Boundary

Rev A4 is a compact routing candidate and JLC preview package for board size, SMT matching, placement, orientation, and silkscreen review. It uses the JLC free ordinary via target: 0.45 mm outer / 0.30 mm drill. It is not a paid-order release until JLC DFM accepts the process and the user checks the SMT orientation preview.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
- The A1-style separated avatar watermark sits near the upper top-side empty area and avoids SMT pads.
