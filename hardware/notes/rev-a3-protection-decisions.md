# Rev A3 Protection Decisions

Date: 2026-05-30

## Accepted Electrical Changes

- VLED TVS: add U6 `TPD1E05U06DPY` from `VLED` to `GND`. KiCad stock symbol and footprint are available as `Power_Protection:TPD1E05U06DPY` and `Package_SON:Texas_DPY0002A_0.6x1mm_P0.65mm`. Working JLC/LCSC candidate is C436349, to be verified in the JLC BOM matcher before payment.
- VBUS to VLED: add R10 `0R` from `VBUS` to `VLED`. This makes the LED anode rail source explicit while keeping a cheap current-measure/isolation option. Working JLC candidate is C21189.
- USB-C shell RC: add R9 `1M` and C17 `10nF` in parallel from `SHIELD` to `GND`. This gives DC bleed through the resistor and RF/ESD shunting through the capacitor without adding a more complex chassis network. Working JLC candidates are C22935 for 1M 0603 and C57112 for 10nF 0603, both to be verified in the JLC BOM matcher.

## Why This Is Not Over-Designed

- U6 is a single-line protection part, not a multi-function USB-C protection IC.
- R9/C17 is the common lightweight shell-to-board-ground treatment for a small USB peripheral when there is no separate metal chassis.
- R10 is a 0R link, so it can be replaced with a short or removed later if the final schematic decides `VLED` should simply be named `VBUS`.

## Crystal Load-Cap Decision

The current crystal candidate is C9002 / X322512MSB4SI, a 12MHz crystal with 20pF load capacitance. For equal external capacitors, the rough calculation is:

```text
C_each ~= 2 * (CL - C_stray)
C_each ~= 2 * (20pF - 3pF)
C_each ~= 34pF
```

That makes the current C13/C14 `33pF` candidate reasonable for this crystal family. The remaining review is not choosing between random values; it is confirming the final crystal's load-capacitance spec and expected board stray capacitance before payment.

## Remaining JLC Gate

JLC orientation preview is still a manual RED gate before payment. This protection update makes the electrical intent clearer, but it does not replace checking the SMT viewer for U6, U2, U5, J1, D1-D6, Y1, SW1, and SW2.
