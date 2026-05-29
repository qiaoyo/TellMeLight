# TellMeLight Rev A Hardware Architecture Notes

Rev A is an integrated USB device, but this milestone does not create PCB layout files.

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

## Local-Only Milestone Boundary

This milestone creates software simulation, protocol tests, and documentation. It does not create schematic, PCB layout, Gerbers, BOM, or enclosure CAD.

## Open Hardware Questions

- Whether each light zone can use one RGB LED or needs multiple LEDs for smoother diffusion.
- Exact USB-C protection and ESD component choices.
- Exact LP5024 package and footprint.
- Mechanical light-isolation wall thickness between split long-bar zones.
