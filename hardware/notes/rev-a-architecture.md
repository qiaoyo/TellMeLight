# TellMeLight Rev A Hardware Architecture Notes

Rev A is now a KiCad hardware baseline for an integrated USB device. It is meant for design review and iteration, not direct fabrication signoff.

## Selected Direction

- USB-C for power and data.
- RP2040-class USB MCU.
- LP5024-class I2C RGB LED driver.
- six RGB light zones using 18 LED driver channels.
- Four visible diffuser bars:
  - Left long bar has two zones.
  - Left middle bar has one zone.
  - Right middle bar has one zone.
  - Right long bar has two zones.

## KiCad Baseline Boundary

This milestone creates:

- KiCad project files.
- Block-level schematic/net-plan notes.
- PCB floorplan and component placement using real KiCad stock footprints.
- Rev A BOM.
- Power-budget simulation notes.
- KiCad CLI ERC, DRC, and export artifacts when the local KiCad installation supports them.

This milestone does not complete pin-by-pin schematic signoff, final routing, enclosure CAD, diffuser optical validation, or release-to-fabrication DFM.

## Open Hardware Questions

- Whether each light zone can use one RGB LED or needs multiple LEDs for smoother diffusion.
- Exact USB-C protection and ESD component choices.
- Exact LP5024 sourcing option; the baseline uses the 32-pin 4 x 4 mm VQFN/WQFN footprint class.
- Mechanical light-isolation wall thickness between split long-bar zones.
