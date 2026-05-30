# Rev A2 Order Readiness

Date: 2026-05-30

## Status

Do not order Rev A2 yet.

## RED Blockers

- RED: RGB LED pinout and KiCad footprint mapping must be confirmed for S4-3528RGBTA-A C2827321.
- RED: JLC orientation preview must be checked for all polarized/oriented parts, especially U2, U5, J1, D1-D6, Y1, SW1, and SW2.

## YELLOW Review Items

- YELLOW: USB-C shell grounding strategy needs enclosure-aware review.
- YELLOW: Crystal C9002 and C13/C14 33pF load caps need final load-capacitance calculation.
- YELLOW: LP5024 exposed-pad stencil, thermal vias, IREF resistor placement, VCAP capacitor placement, and VCC capacitor placement need layout review.
- YELLOW: CPL coordinates are a draft based on the Rev A1 placement and must be regenerated from final KiCad positions before upload.
- YELLOW: PCB fabrication, SMT assembly, part handling, tax, and shipping require JLC quote upload.

## GREEN Items

- GREEN: RP2040 C2040 remains the MCU candidate.
- GREEN: LP5024RSMR C427525 remains the LED driver candidate.
- GREEN: W25Q32JVSSIQ C179173 is the working flash alternate.
- GREEN: AP2112K-3.3TRG1 C51118 remains the 3V3 regulator candidate.
- GREEN: TPD2EUSB30DRTR C94934 has a corrected 3-pin DRT footprint direction.
- GREEN: USB-C TYPE-C-31-M-12 C165948 remains the connector candidate.
- GREEN: Small resistors/capacitors/switches now have JLC-searchable candidates.

## Before Paying For Boards

1. Resolve RGB LED pad/color/common-anode mapping.
2. Regenerate KiCad schematic/PCB from the final pin map.
3. Run ERC, DRC, Gerber, drill, BOM, and CPL exports.
4. Upload Gerber, BOM, and CPL to JLC and inspect their SMT placement/orientation preview.
5. Save the JLC quoted PCB+SMT+shipping cost back into the repo.
