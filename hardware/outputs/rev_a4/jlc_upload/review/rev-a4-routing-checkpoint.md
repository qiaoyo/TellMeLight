# TellMeLight Rev A4 Placement/Fanout Routing Checkpoint

Date: 2026-06-01

Status: `READY_FOR_JLC_PREVIEW_NOT_PAYMENT`

Payment gate: `NOT_FOR_PAYMENT` until JLC DFM and SMT orientation preview pass.

DRC: 0 violations and 0 unconnected items.

Scope: placement/fanout revision.

## What Was Proven

- Rev A4 keeps the compact 76 mm x 56 mm four-layer board outline.
- U6 adds VLED-to-GND TVS/ESD protection.
- USB-C shell grounding uses the R9 1M and C17 10nF RC path to GND.
- C18 adds the RP2040 `VREG_OUT` local capacitor.
- RP2040 and LP5024 fine-pitch pins now have explicit fanout for signal, power, and local support nets.
- KiCad exported Specctra DSN, Freerouting generated SES, KiCad imported SES, and final DRC reports 0 violations and 0 unconnected items.

## Important Process Detail

The final Rev A4 board is produced by:

1. Generate the fanout board with `TML_A4_FANOUT_ONLY=1`.
2. Export `hardware/outputs/rev_a4/tellmelight_rev_a4_fanout.dsn`.
3. Route with Freerouting to `hardware/outputs/rev_a4/tellmelight_rev_a4_autorouted.ses`.
4. Run `tools/hardware/finalize_rev_a4_route.py` to import the SES and remove three unused B-only fanout vias.
5. Run KiCad DRC with zone refill.

The three removed vias were not electrical connections after routing; each had only B.Cu same-net tracks meeting at the coordinate, so removing the via clears dangling-via warnings without changing connectivity.

## Current Gate

Rev A4 is ready for JLC preview upload, but not payment.

Before paying:

- Confirm JLC Gerber preview, 4-layer stack, 76 mm x 56 mm board size, and drill recognition.
- Confirm JLC accepts the current 0.10 mm drill / 0.25 mm via geometry without unexpectedly quoting an advanced process.
- Confirm SMT orientation preview for D1-D6, U2, U5, U6, J1, Y1, SW1, and SW2.
- Confirm RGB LED color warning maps to C2827321 and Y1 is a passive crystal.
