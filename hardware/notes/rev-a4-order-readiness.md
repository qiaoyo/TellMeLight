# TellMeLight Rev A4 Order Review

Date: 2026-05-31

Rev A4 is the first compact routing checkpoint after the user's JLC dry run.

## What Changed

- Board size reduced to 76 mm x 56 mm.
- U6/R9/C17/R10 are now included in the real PCB placement and JLC BOM/CPL.
- VLED has TVS/ESD protection through U6.
- USB-C shell uses R9 1M and C17 10nF in parallel to GND.
- VBUS-to-VLED is explicit through R10 0R.
- C18 adds the required RP2040 VREG_VOUT local capacitor.
- The top-side silkscreen has a small A1-style separated avatar watermark in line art.
- The top-side title includes the persistent By Joey.qiao attribution.
- This package checks JLC board size, SMT matching, placement, orientation, and silkscreen. It is still not the paid-order electrical routing release because routing signoff is blocked until DRC reports 0 violations and 0 unconnected items.

## Known JLC Warnings To Interpret

- RGB LED color confirmation for D1-D6 is expected. Confirm it matches RGB three-color C2827321.
- LP5024 color-like warning can appear because the part description includes RGB LED driver language; confirm U2 is C427525.
- Y1 active/passive warning is expected. Confirm C9002 is a passive 12 MHz crystal, not an active oscillator.
- If a row named DESIGNATOR appears as an abnormal component, the JLC importer has treated a header row as a part. Use the Rev A4 files in this package and re-map headers explicitly.

## Stop Before Payment

Do not pay until the JLC orientation preview confirms D1-D6, U2, U5, U6, J1, Y1, SW1, and SW2.

The next hardware step is a Rev A4 placement/fanout revision that reaches DRC 0 and 0 unconnected items.
