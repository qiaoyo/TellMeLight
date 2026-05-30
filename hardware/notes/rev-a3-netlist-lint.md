# Rev A3 Netlist Lint

Date: 2026-05-30

Status: PASS_WITH_REVIEW_ITEMS

Rev A2 remains NOT_FOR_ORDER. This lint checks the Rev A3 machine-readable pin netlist for obvious connectivity omissions before a KiCad schematic draft is generated.

## Required Nets

- GND: OK, 34 pins.
- 3V3: OK, 27 pins.
- VBUS: OK, 6 pins.
- VLED: OK, 6 pins.
- I2C0_SDA: OK, 4 pins.
- I2C0_SCL: OK, 4 pins.
- USB_DP_MCU: OK, 2 pins.
- USB_DP_CONN: OK, 4 pins.
- USB_DM_MCU: OK, 2 pins.
- USB_DM_CONN: OK, 4 pins.
- FLASH_CS_N_BOOTSEL: OK, 3 pins.
- RUN_RESET: OK, 4 pins.
- LP_IREF: OK, 2 pins.
- LP_VCAP: OK, 2 pins.


## No unexpected single-pin nets

No unexpected single-pin nets were found.


## Review single-pin nets

- GPIO0_RESERVED: U1.2. Reserved RP2040 GPIO for later feature/debug use.
- GPIO1_RESERVED_LP_EN_OPTION: U1.3. Reserved RP2040 GPIO for later feature/debug use.
- NC_LP_OUT18_RESERVE: U2.19. Intentional no-connect or reserved no-connect net.
- NC_LP_OUT19_RESERVE: U2.20. Intentional no-connect or reserved no-connect net.
- NC_LP_OUT20_RESERVE: U2.21. Intentional no-connect or reserved no-connect net.
- NC_LP_OUT21_RESERVE: U2.22. Intentional no-connect or reserved no-connect net.
- NC_LP_OUT22_RESERVE: U2.23. Intentional no-connect or reserved no-connect net.
- NC_LP_OUT23_RESERVE: U2.24. Intentional no-connect or reserved no-connect net.
- NC_SBU: J1.A8/B8. Intentional no-connect or reserved no-connect net.
- NC_U4_4: U4.4. Intentional no-connect or reserved no-connect net.
- RP2040_VREG_OUT: U1.45. RP2040 internal regulator output needs final decoupling review in the schematic draft.
- SHIELD: J1.S1/S2/S3/S4. USB-C shell grounding strategy depends on enclosure and ESD review.


## Review Findings

- YELLOW: VLED_SOURCE_MODEL. VLED source model: VLED currently touches only RGB LED common-anode pads; Rev A3 schematic must explicitly model its VBUS-derived source or rename it to the source rail.
- RED: JLC_ORIENTATION_PREVIEW_OUT_OF_SCOPE. JLC orientation preview remains outside this lint and must be checked manually before payment.


## Boundary

JLC orientation preview remains outside this lint. This report can catch data-model mistakes, but it cannot validate LED rotation, connector orientation, LP5024 pin-1 orientation, crystal loading, USB-C shell grounding, or actual PCB DFM.
