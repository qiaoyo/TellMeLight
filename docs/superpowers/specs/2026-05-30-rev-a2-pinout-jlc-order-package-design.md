# Rev A2 Pinout And JLC Order Package Design

Date: 2026-05-30

## Goal

Move TellMeLight from the Rev A1 JLC-oriented baseline toward a realistic fabrication review package by replacing the block-level electrical model with a pin-by-pin design basis and by preparing JLC BOM/CPL/cost artifacts.

Rev A2 is still not a purchase order. It is the stage that should make a later "can we upload this to JLC and pay for prototypes?" decision much less fuzzy.

## Current State

Rev A1 has:

- A separate KiCad project at `hardware/kicad/tellmelight_rev_a1/`.
- A 4-layer PCB floorplan.
- Front optical LEDs and back-side electronics placement.
- JLC candidate sourcing table.
- Gerber, drill, POS, STEP, PDF/SVG, and PNG outputs.
- ERC 0 and DRC 0, but only for a block-level schematic/net plan.
- Cost preview showing a known priced component subtotal of about USD 4.48 per board, excluding PCB fabrication, SMT assembly, tooling, tax, shipping, passives, enclosure, and diffuser.

Rev A1 remaining blockers:

- The schematic is not pin-by-pin yet.
- The RGB LED candidate and KiCad footprint pin mapping must be verified.
- `W25Q32JVSSIQ C82344` currently has stock risk, so Rev A2 should use or compare an in-stock flash alternate such as `C179173`.
- USB-C shell grounding and ESD placement need an electrical review basis.
- LP5024 exposed-pad and channel mapping need a layout review basis.
- Exact JLC BOM/CPL upload files are not ready.

## Rev A2 Approach

Use a separate Rev A2 project tree rather than mutating Rev A1 in place.

Files should live under:

- `hardware/kicad/tellmelight_rev_a2/`
- `hardware/bom/rev_a2_*.csv`
- `hardware/notes/rev-a2-*.md`
- `hardware/outputs/rev_a2/`

This preserves Rev A1 as a visual/manufacturing baseline while Rev A2 can become more electrically strict.

## Electrical Scope

Rev A2 must produce a reviewed pin map for:

- RP2040 QFN-56:
  - USB D+/D-.
  - QSPI flash pins.
  - SWDIO, SWCLK, RUN, BOOTSEL.
  - I2C pins for LP5024.
  - XIN/XOUT and crystal load capacitors.
  - Power pins and local decoupling groups.
- LP5024RSMR:
  - SDA/SCL, address/config pins, enable/reset pins if used.
  - OUT0..OUT17 to six RGB channels.
  - OUT18..OUT23 reserved and explicitly documented.
  - VCC/GND/exposed pad treatment.
- USB-C receptacle:
  - VBUS.
  - GND and shield/shell handling.
  - CC1/CC2 pull-downs.
  - D+/D- orientation pairs.
  - SBU no-connect decision.
- USB ESD:
  - Connector-side D+/D-.
  - MCU-side D+/D-.
  - Ground return.
- QSPI flash:
  - CS, CLK, IO0..IO3, VCC, GND.
- RGB LEDs:
  - Common anode to VLED.
  - Per-color cathodes to LP5024 channels.
  - Exact footprint pad mapping for the final JLC-selected LED.
- Power:
  - VBUS/VLED.
  - 3V3 regulator input/output.
  - Bulk and local decoupling.

## Manufacturing Scope

Rev A2 should generate order-prep artifacts:

- JLC-oriented BOM with exact C-codes where known.
- JLC-oriented CPL/POS file based on KiCad positions.
- Sourcing decision table with active part status:
  - use selected part,
  - use alternate,
  - unresolved before order.
- Cost model that separates:
  - known priced components,
  - unpriced passives/mechanicals,
  - PCB fabrication,
  - SMT assembly,
  - shipping/tax,
  - enclosure/diffuser.
- Order readiness checklist with red/yellow/green status.

## Cost Policy

Do not present a fake all-in quote.

Rev A2 may present:

- Known priced component subtotal from official JLC part pages.
- Per-board estimated component subtotal for 1, 5, and 10 unit builds.
- Explicit exclusions for PCB fabrication, assembly, tooling, shipping, tax, enclosure, and diffuser.
- A checklist step requiring manual JLC quote upload before the user spends money.

## Sources To Use

Primary sources only:

- JLCPCB capabilities: `https://jlcpcb.com/capabilities/Capabilities`
- JLCPCB PCB assembly: `https://jlcpcb.com/pcb-assembly`
- JLCPCB parts library: `https://jlcpcb.com/parts`
- RP2040 datasheet: `https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf`
- RP2040 hardware design guide: `https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf`
- TI LP5024 datasheet: `https://www.ti.com/lit/ds/symlink/lp5024.pdf`
- Final RGB LED datasheet or JLC part page for the selected LED footprint.

## Deliverables

Rev A2 should add:

- `hardware/notes/rev-a2-pin-map.md`
- `hardware/notes/rev-a2-order-readiness.md`
- `hardware/notes/rev-a2-sourcing-decisions.md`
- `hardware/bom/rev_a2_bom.csv`
- `hardware/bom/rev_a2_jlc_bom.csv`
- `hardware/bom/rev_a2_jlc_cpl.csv`
- `hardware/bom/rev_a2_cost_estimate.csv`
- `hardware/kicad/tellmelight_rev_a2/`
- `hardware/outputs/rev_a2/`
- Tests that confirm Rev A2 does not regress the selected architecture or hide order blockers.

## Non-Goals

- Do not place a JLC order.
- Do not claim the design is production-ready.
- Do not solve enclosure/diffuser CAD unless it blocks component placement.
- Do not switch away from RP2040 + LP5024 unless a sourced part or pinout check creates a hard blocker.

## Success Criteria

Rev A2 is successful when:

- Every main IC and connector has a documented pin-level mapping.
- The RGB LED footprint and part pinout are resolved or marked as a blocking red item.
- The flash stock issue is resolved by selecting an available alternate or marking the original part as blocked.
- KiCad Rev A2 ERC/DRC/export commands run locally.
- JLC BOM/CPL/cost files exist and clearly separate priced and unpriced costs.
- The order readiness checklist tells the user exactly what remains before paying for boards.
