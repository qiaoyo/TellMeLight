# TellMeLight Rev A4 Routing Checkpoint

Date: 2026-05-31

Status: `NOT_FOR_PAYMENT`

## What Was Proven

- Rev A4 adds `C18 1uF` from `RP2040_VREG_OUT` to GND.
- U2 LED-output fanout can be generated without copper clearance errors when limited to LED channels.
- KiCad can export `Specctra DSN`, Freerouting can route the board headlessly, and KiCad can import `Specctra SES`.
- The imported autoroute can reach zero copper DRC violations, but still leaves unconnected items around RP2040/LP5024 escape routing and local support nets.

## Current Blocker

The current 76 mm x 56 mm placement is too tight around:

- `U1 RP2040` lower edge near USB/R1/R2/C7/C18/QSPI routes.
- `U2 LP5024RSMR` lower support pins and adjacent passives.
- `U3 QSPI flash` to U1 fanout corridor.

This is a placement/fanout problem, not a JLC upload problem. Paying for this PCB would waste money because it is not electrically complete.

## Best Observed Autoroute Result

- Freerouting v2.2.3 with a portable Java 25 runtime.
- LED-channel fanout before DSN export.
- KiCad DRC after SES import: zero copper violations before manual route experiments, but remaining unconnected items.
- Therefore the correct next step is not manual long-wire patching; it is a Rev A4 placement/fanout revision.

## Recommended A4 Next Revision

1. Move U3 closer to RP2040 QSPI pins or rotate it to preserve signal order.
2. Move R1/R2/C7 so RP2040 USB pins have a clean short escape path.
3. Move C18 closer to U1.45 while outside the U1 courtyard.
4. Keep the LED fanout corridors around U2, but avoid using U2 pin 7/D3_R fanout until the left-side corridor is widened.
5. Add local GND and 3V3 zones only after autoroute import, then rerun DRC.
6. Treat JLC upload as a dry-run only until `DRC: 0 violations and 0 unconnected items`.
