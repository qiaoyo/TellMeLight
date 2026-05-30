# TellMeLight Rev A2 KiCad Project

Generated: 2026-05-30

## Contents

- `tellmelight_rev_a2.kicad_pro`: KiCad project.
- `tellmelight_rev_a2.kicad_sch`: Rev A2 review schematic/net plan linked to the pin map.
- `tellmelight_rev_a2.kicad_sym` and `sym-lib-table`: local symbols so KiCad can export a review BOM.
- `tellmelight_rev_a2.kicad_pcb`: 4-layer PCB floorplan with the Rev A2 footprint corrections.
- `tellmelight_rev_a2.pretty/`: local footprints, currently including the TUOZHAN S4-3528RGBTA-A RGB LED footprint.

## Rev A2 Changes From Rev A1

- U5 USB ESD footprint is corrected from `SOT-23-6` to `Texas_DRT-3` for `TPD2EUSB30DRTR`.
- D1-D6 use a local TUOZHAN S4-3528RGBTA-A footprint because the Rev A1 Wurth PLCC4 pad numbering was opposite the C2827321 datasheet orientation.
- U3 flash sourcing direction uses `C179173` as the working alternate while `C82344` has stock risk.
- R7/R8 and C15/C16 are added to the board placement for LP5024 IREF, EN, VCAP, and VCC support.
- The order package now has JLC-searchable candidates for the small resistors, capacitors, crystal, and service switches.

## Important Boundary

This remains a Rev A2 review package. Do not order boards until the JLC orientation preview is checked for D1-D6 and all other polarized/oriented parts.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
