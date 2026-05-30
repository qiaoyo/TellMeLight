# Rev A2 Sourcing Decisions

Date: 2026-05-30

## Decisions

- GREEN: RP2040 stays as U1 with JLC candidate C2040.
- GREEN: LP5024RSMR stays as U2 with JLC candidate C427525. This keeps six independent RGB session slots with true constant-current sinks.
- GREEN: Rev A2 uses W25Q32JVSSIQ C179173 as the working flash alternate.
- YELLOW: Rev A1 selected flash C82344 remains visible for history, but it has stock risk and should not drive the working cost model.
- YELLOW: TPD2EUSB30DRTR C94934 stays, but Rev A2 corrects the KiCad footprint from Rev A1 SOT-23-6 to Texas_DRT-3.
- GREEN: RGB LED pinout for S4-3528RGBTA-A C2827321 is now mapped from the TUOZHAN datasheet: pin 1 blue cathode, pin 2 common anode, pin 3 green cathode, pin 4 red cathode.
- RED: JLC orientation preview is still the main RGB LED order blocker because D1-D6 are polarized optical parts and must be checked in the JLC SMT viewer before payment.
- GREEN/YELLOW: Small components are now assigned JLC-searchable candidates where practical. Exact price and assembly class still need to be confirmed inside the JLC BOM quote.

## Small Component Candidates

| Function | Designators | Value | JLC candidate | Status | Reason |
| --- | --- | --- | --- | --- | --- |
| USB series | R1,R2 | 27R 0603 | C25190 | GREEN | JLC-searchable 0603 27 ohm resistor. |
| USB-C CC Rd | R3,R4 | 5.1k 0603 | C23186 | GREEN | JLC-searchable 0603 5.1k resistor. |
| I2C pull-ups | R5,R6 | 4.7k 0603 | C23162 | GREEN | Common I2C pull-up value. |
| LP5024 IREF/EN | R7,R8 | 10k 0603 | C25804 | GREEN | IREF gives conservative default LED current; EN pull-up prevents floating input. |
| Decoupling | C1-C10 | 100nF 0603 | C1591 | GREEN | Common 3V3 local bypass value. |
| Bulk/LDO | C11,C12 | 10uF 0603 | C19702 | GREEN | JLC-searchable, but final review should consider MLCC DC-bias derating. |
| LP5024 local caps | C15,C16 | 1uF 0603 | C15849 | GREEN | Required near VCAP and VCC by TI datasheet. |
| Crystal load | C13,C14 | 33pF C0G 0603 | C2594250 | YELLOW | First match for C9002 20pF-load crystal; verify stray capacitance. |
| Crystal | Y1 | 12MHz 3225 | C9002 | YELLOW | Searchable 12MHz candidate; final load-cap and footprint review required. |
| Service buttons | SW1,SW2 | EVQP2R02M | C79161 | GREEN | Searchable Panasonic 4.7 x 3.5mm SMD tactile switch. |

## Why The Flash Alternate Matters

Rev A1 used C82344 in the BOM. The Rev A1 cost preview already flagged C82344 stock risk. Rev A2 keeps C82344 documented, but uses C179173 for the working order package so a future JLC quote is less likely to fail at BOM matching.

## Why The USB ESD Footprint Changed

TPD2EUSB30DRTR is the TI DRT 3-pin package. It has D+, D-, and GND pins. It is a shunt ESD clamp placed near the USB-C connector, not a six-pin flow-through component. Rev A2 therefore uses KiCad footprint Package_TO_SOT_SMD:Texas_DRT-3 and keeps orientation review as YELLOW until KiCad/JLC placement is inspected.

## RGB LED Pinout Resolution

The LCSC/TUOZHAN datasheet for S4-3528RGBTA-A C2827321 shows a 3.5 mm x 2.8 mm SMD3528-4P common-anode RGB LED. The footprint used in Rev A1 was a Wurth PLCC4 footprint with pin 1 on the opposite side, so Rev A2 now uses a local footprint:

`TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm`.

Pin mapping:

- Pin 1 = blue cathode.
- Pin 2 = common anode to VLED.
- Pin 3 = green cathode.
- Pin 4 = red cathode.

This resolves the electrical pad/color mapping, but JLC orientation preview remains mandatory.

## Remaining Substitution Rule

If any small component cannot be found during the JLC upload, substitute by matching package, electrical value, tolerance/rating, assembly type, and footprint. Do not silently substitute the RGB LED, LP5024, RP2040, USB-C connector, or USB ESD part because those affect pinout and DFM.
