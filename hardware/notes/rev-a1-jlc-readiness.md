# Rev A1 JLC Readiness Notes

Date: 2026-05-30

Rev A1 is a local fabrication-candidate baseline, not an order release.

## Confirmed Direction

- No assumed user hand-soldering.
- JLC DFM review before ordering.
- double-sided SMT assembly pricing and capability check.
- LP5024 VQFN exposed-pad paste and thermal-pad review.
- RGB LED pinout verification against the final JLC selected part.
- USB-C connector footprint and shell grounding review.

## Current JLC Candidate Parts

| Designator | Part | JLC candidate |
| --- | --- | --- |
| U1 | RP2040 | C2040 |
| U2 | LP5024RSMR | C427525 |
| U3 | W25Q32JVSSIQ | C82344 |
| U4 | AP2112K-3.3TRG1 | C51118 |
| U5 | TPD2EUSB30DRTR | C94934 |
| J1 | TYPE-C-31-M-12 | C165948 |
| D1-D6 | S4-3528RGBTA-A | C2827321 |

## Remaining Order Blockers

- Replace block-level schematic review symbols with a pin-by-pin schematic before fabrication.
- Verify the 4-pin RGB LED pad mapping against the final part datasheet.
- Review USB D+/D- routing, ESD placement, and differential pair geometry.
- Review 4-layer stackup, impedance assumptions, and copper pours against the selected JLC service.
- Export JLC BOM and CPL files in the exact order-site format after final component matching.
- Decide whether the first paid order uses black solder mask plus ENIG or a lower-cost engineering finish.
