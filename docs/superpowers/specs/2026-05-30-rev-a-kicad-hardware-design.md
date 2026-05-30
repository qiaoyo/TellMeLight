# Rev A KiCad Hardware Design

Date: 2026-05-30

## Goal

Create the first local KiCad hardware baseline for TellMeLight: a USB-C connected, integrated PCB that drives six persistent AI-session light zones through a four-bar diffuser layout.

This baseline is intended for design review, firmware bring-up planning, and PCB iteration. It is not a release-to-fabrication signoff without a human schematic, footprint, and DFM review.

## Approved Product Direction

- Wired USB-C for power and data.
- No development board in the product; the PCB is integrated.
- Six logical session slots are kept as a FIFO queue.
- Idle slots are off.
- Running and approval states can breathe in firmware.
- Done and error states remain visible until the user or host clears them.
- Visual core uses four ByteDance-style vertical diffuser bars:
  - Left long bar contains two light zones.
  - Left middle short bar contains one light zone.
  - Right middle short bar contains one light zone.
  - Right long bar contains two light zones.
- The left long bar is slightly shorter than the right long bar.
- The two middle bars are equal size; the left short bar sits lower and the right short bar sits only slightly higher.
- Bar shapes are soft, rounded, irregular trapezoids:
  - Left long, right long, and left middle bars have their shorter side facing right.
  - Right middle bar has its shorter side facing left.

## Electrical Architecture

### USB And MCU

- Use an RP2040-class USB microcontroller as the main controller.
- Use USB full-speed data on the USB-C receptacle.
- Add 27 ohm series resistors on USB D+ and D- near the MCU.
- Add USB ESD protection close to the USB-C connector.
- Add CC pull-down resistors so the board enumerates as a USB-C device.
- Use an external QSPI flash for RP2040 firmware storage.
- Add 12 MHz crystal support for the RP2040 clock.
- Expose SWD, reset, boot select, 3V3, and GND pads for bring-up.

### LED Driver

- Use an LP5024-class 24-channel I2C constant-current RGB LED driver.
- Use 18 channels for six RGB zones; leave six channels reserved.
- Power logic from 3V3 and LED anodes from the USB 5V LED rail unless review later moves LED power to 3V3.
- Use one common-anode RGB LED per zone for Rev A. The mechanical diffuser may later require multiple emitters per zone, but that belongs to Rev B after optical tests.
- I2C pull-ups live on the 3V3 rail.
- Address pins are strapped for a single driver at the base address.

### Power

- USB VBUS enters through input protection and feeds:
  - 5V LED rail.
  - 3V3 regulator for MCU, flash, and LED driver logic.
- Use an AP2112K-3.3-class LDO in SOT-23-5 for the first baseline.
- Size decoupling locally:
  - USB input bulk capacitance near the connector/regulator.
  - 3V3 regulator input/output capacitors near the LDO.
  - One local 100 nF decoupler per IC supply cluster.
  - LED rail bulk capacitance near the LED driver/LED zones.

## Mechanical And PCB Intent

- PCB outline is a compact near-square core display module with enough room for USB-C, programming pads, and diffuser alignment.
- Front-side LED placement follows the four-bar visual layout.
- Silkscreen and drawing layers mark diffuser bar boundaries, split points in long bars, and session indices.
- Rev A PCB is a placement and routing baseline:
  - The KiCad board must contain real footprints for the main components.
  - The LED geometry must match the approved visual direction.
  - The first generated PCB may use simple routing scaffolds and explicit review notes rather than final hand-tuned high-density routing.

## BOM Intent

The baseline BOM must include:

- RP2040 MCU, QFN-56 7 x 7 mm.
- LP5024 LED driver, VQFN-32 RSM 4 x 4 mm.
- USB-C USB2 receptacle.
- AP2112K-3.3-class LDO.
- TPD2EUSB30-class USB ESD protection.
- W25Q32JVSS-class QSPI flash.
- 12 MHz crystal and load capacitors.
- Six common-anode PLCC-6 RGB LEDs.
- USB resistors, CC resistors, I2C pull-ups, boot/reset passives, decoupling capacitors, and test pads.

## Simulation And Checks

Rev A local simulation means engineering calculation and CAD checks, not SPICE signoff:

- Power budget table for idle, typical, and worst-case LED current.
- KiCad schematic ERC report.
- KiCad PCB DRC report.
- KiCad exports for Gerber, drill, position, STEP, PDF/SVG or rendered preview when supported by the installed KiCad CLI.
- Repository tests that confirm required hardware artifacts and component decisions exist.

## Open Review Items

- Confirm exact RGB LED optical output, viewing angle, color balance, and availability.
- Confirm whether LED anodes stay on USB 5V or move to 3V3 after brightness tests.
- Confirm USB-C receptacle mechanical model and shell grounding strategy.
- Confirm final enclosure, diffuser material, wall thickness, and light isolation.
- Confirm manufacturability of QFN/VQFN assembly for the intended PCB vendor.
