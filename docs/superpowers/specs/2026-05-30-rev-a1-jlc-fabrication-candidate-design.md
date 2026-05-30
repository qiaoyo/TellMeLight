# Rev A1 JLC Fabrication Candidate Design

Date: 2026-05-30

## Goal

Turn the Rev A KiCad baseline into a JLC-oriented fabrication candidate for TellMeLight: still local-only and not order-ready, but now shaped around high integration, no user hand-soldering, and a product-like visual finish.

Rev A1 keeps the six-session FIFO behavior and four-bar visual language from Rev A. The change is manufacturing discipline: component sourcing, assembly side strategy, stackup, test access, and design notes should now make sense for a JLCPCB/JLC PCBA workflow.

## User Constraints

- The user likely wants to fabricate through JLC/JLCPCB.
- The user does not currently have soldering tools and prefers not to hand-solder.
- The hardware should look polished and technical, not like a dev board.
- Cost is not yet known well enough to drive every decision, so Rev A1 should make conservative engineering defaults and clearly mark cost-sensitive gates.
- Work should continue on local artifacts first: KiCad, BOM, exports, manufacturing notes, and verification. No real PCB order is placed in this milestone.

## Manufacturing Approach

Recommended approach: use a high-integration JLC SMT assembly path.

- Use a 4-layer PCB by default.
  - L1: front optical LEDs, local routing, display guide artwork.
  - L2: continuous ground plane.
  - L3: 3V3 and VLED power distribution.
  - L4: back-side MCU, USB, LED driver, flash, regulator, passives, and debug pads.
- Use double-sided SMT placement:
  - Front side holds only the six RGB emitters and product-facing marks.
  - Back side holds logic, power, USB, test pads, and service controls.
- Avoid through-hole hand assembly.
- Replace the 1.27 mm SWD header with pogo/test pads for product-like appearance, while keeping the signal set for bring-up.
- Prefer black solder mask and ENIG for the product-looking prototype if cost is acceptable at order time. Green solder mask/HASL is the fallback for a cheaper engineering sample.
- Treat JLC official DFM and parts-library matching as required checks before ordering.

Official references checked for Rev A1 assumptions:

- JLCPCB capabilities: `https://jlcpcb.com/capabilities/Capabilities`
- JLCPCB PCB assembly service: `https://jlcpcb.com/pcb-assembly`
- JLCPCB parts library: `https://jlcpcb.com/parts`
- Raspberry Pi RP2040 datasheet: `https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf`
- TI LP5024 datasheet: `https://www.ti.com/lit/ds/symlink/lp5024.pdf`

## Architecture Decision

Use the existing RP2040 + LP5024 architecture.

Alternatives considered:

1. RP2040 + LP5024 + six discrete common-anode RGB LEDs.
   - Best fit for a product-like device.
   - Hardware PWM/current control is clean and expandable.
   - The LP5024 is available in the JLC parts ecosystem as `C427525` for `LP5024RSMR`.
   - Requires careful QFN/VQFN layout and assembly review.
2. RP2040 + six addressable RGB LEDs.
   - Lowest part count and simple routing.
   - Less product-like for a polished hardware design, tighter firmware timing behavior, and less graceful current control.
3. RP2040 module or dev-board-style carrier.
   - Fastest bring-up.
   - Conflicts with the integrated aesthetic and adds board-to-board/package constraints.

Rev A1 selects option 1.

## Component Direction

Rev A1 should keep these main components:

- U1: Raspberry Pi `RP2040`, JLC candidate `C2040`.
- U2: TI `LP5024RSMR`, JLC candidate `C427525`.
- U3: Winbond `W25Q32JVSSIQ` QSPI flash, JLC candidate `C82344`.
- U4: Diodes Inc `AP2112K-3.3TRG1` 3V3 LDO, JLC candidate `C51118`.
- U5: TI `TPD2EUSB30DRTR` USB ESD protector, JLC candidate `C94934`.
- J1: HRO `TYPE-C-31-M-12` USB-C USB2 receptacle, JLC candidate `C165948`.
- D1-D6: common-anode 4-pin 3528 RGB LED, with `S4-3528RGBTA-A` / JLC `C2827321` as the first sourcing candidate.

Rev A1 intentionally changes the LED footprint direction from generic `LED_RGB_PLCC-6` to a 4-pin PLCC/3528 common-anode style because it better matches JLC-assembly-friendly commodity RGB emitters.

Passives should use JLC basic/common 0603 parts where possible:

- 27 ohm USB series resistors.
- 5.1 kohm USB-C CC pull-down resistors.
- 4.7 kohm I2C pull-ups.
- 100 nF X7R decoupling capacitors.
- 10 uF input/output/bulk capacitors sized for USB VBUS and 3V3 rails.
- Crystal load capacitors selected after the exact 12 MHz crystal is chosen.

## Electrical Requirements

- USB-C is a USB2 device connection for power and data.
- CC1 and CC2 each get a 5.1 kohm pull-down to ground.
- USB D+ and D- route through ESD protection and 27 ohm series resistors near the RP2040.
- RP2040 uses external QSPI flash and a 12 MHz crystal.
- LP5024 uses I2C from the RP2040 with 4.7 kohm pull-ups to 3V3.
- LP5024 OUT0..OUT17 drive six RGB zones; OUT18..OUT23 remain reserved.
- LEDs are common-anode and powered from VLED, with the LP5024 sinking each color channel.
- VLED is sourced from USB VBUS for Rev A1; firmware brightness limits keep USB current reasonable.
- 3V3 powers RP2040, flash, LED driver logic, ESD logic if needed, pull-ups, and debug pads.

## Mechanical And Visual Requirements

- Keep the approved four-bar display core:
  - Left long bar: two zones; shorter than the right long bar.
  - Left middle bar: one short zone; lower.
  - Right middle bar: one short zone; slightly higher and upright.
  - Right long bar: two zones; tallest visual bar.
- Keep the irregular rounded trapezoid direction:
  - Left long, left middle, and right long bars have the short edge facing right.
  - Right middle bar has the short edge facing left.
- Rev A1 PCB should keep front-side marks that help align a future diffuser, but it should not pretend to solve the enclosure.
- Add at least one manufacturing note that the diffuser, light isolation walls, and outer enclosure are Rev B mechanical work unless a user decision pulls them earlier.

## Deliverables

Rev A1 should produce:

- A Rev A1 KiCad project in `hardware/kicad/tellmelight_rev_a1/`.
- A Rev A1 BOM in `hardware/bom/rev_a1_bom.csv`.
- A JLC sourcing table in `hardware/bom/rev_a1_jlc_sourcing.csv`.
- A Rev A1 power budget in `hardware/simulation/`.
- KiCad CLI ERC, DRC, Gerber, drill, position, STEP, PDF/SVG, and PNG render outputs under `hardware/outputs/rev_a1/`.
- A manufacturing readiness note at `hardware/notes/rev-a1-jlc-readiness.md`.
- Repository tests that verify the Rev A1 files, sourcing decisions, and output paths exist.

## Verification Gate

Rev A1 is acceptable when:

- Repository tests pass.
- KiCad ERC completes with no violations.
- KiCad DRC completes with no violations or only explicitly documented non-order-blocking warnings.
- The BOM and sourcing table include JLC candidate codes or review status for every major component.
- The PCB keeps the approved visual geometry while moving the design toward 4-layer, no-hand-solder assembly.
- A verification summary records commands run, KiCad warnings, sourcing risks, and remaining human review gates.

## Non-Goals

- Do not place a real JLC order in Rev A1.
- Do not claim the board is fabrication-ready without a human electrical, footprint, and DFM review.
- Do not design the final enclosure or optical diffuser in this milestone.
- Do not switch to addressable LEDs unless the LP5024 sourcing or DFM check becomes a blocker.

## Decision Gates For The User

These are the next meaningful choices once Rev A1 artifacts exist:

- Whether to pay for 4-layer, double-sided SMT, black solder mask, and ENIG for the first board.
- Whether to keep the LP5024 route after JLC BOM matching, or switch to addressable LEDs for a cheaper EVT.
- Whether the Rev A1 board should expose visible buttons, hidden back buttons, or only pogo/test-pad service controls.
- Whether enclosure/diffuser CAD starts before or after the first electronic board order.
