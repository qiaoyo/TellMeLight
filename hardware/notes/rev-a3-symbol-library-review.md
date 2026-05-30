# Rev A3 Symbol Library Review

Date: 2026-05-30

Status: LOCAL_SYMBOL_READY_FOR_SCHEMATIC_DRAFT

Rev A2 remains NOT_FOR_ORDER. This Rev A3 checkpoint only removes the missing-symbol blocker for a later pin-level schematic draft.

## Local Symbols

- LP5024RSMR: local KiCad symbol with OUT0..OUT23, ADDR0, ADDR1, VCC, SDA, SCL, EN, IREF, VCAP, and GND_EP.
- S4-3528RGBTA-A: local KiCad symbol for C2827321 with pad 1 blue cathode, pad 2 common anode, pad 3 green cathode, and pad 4 red cathode.

## Validation

- KiCad symbol library syntax is checked by `kicad-cli sym upgrade`.
- The upgraded check copy is written to `hardware/outputs/rev_a3/tellmelight_rev_a3_symbol_upgrade_check.kicad_sym`.

## Remaining Boundaries

- TI LP5024 pin order still needs visual schematic review against the datasheet during Rev A3.
- The JLC SMT orientation preview remains mandatory before payment.
- This symbol checkpoint does not create final routing, final ERC/DRC signoff, or fabrication approval.
