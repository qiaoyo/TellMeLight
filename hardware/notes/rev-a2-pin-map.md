# TellMeLight Rev A2 Pin Map

Date: 2026-05-30

Rev A2 is a reviewed pin plan for the current RP2040 + LP5024 + QSPI flash + six RGB LED architecture. It is more precise than Rev A1, but it is still not an order release while RED items remain.

## RP2040 Pin Map

| RP2040 pin | Net | Connection | Status | Notes |
| --- | --- | --- | --- | --- |
| 2 GPIO0 | reserved/session debug | Test pad or future feature | GREEN | Kept free in Rev A2. |
| 3 GPIO1 | reserved/LP_EN option | Optional future control for LP5024 EN | YELLOW | Current Rev A2 ties LP5024 EN high through R8 to reduce firmware bring-up risk. |
| 6 GPIO4 | I2C0_SDA | LP5024 SDA pin 28 through shared I2C bus with R5 4.7k pull-up | GREEN | Firmware LED driver bus. |
| 7 GPIO5 | I2C0_SCL | LP5024 SCL pin 29 through shared I2C bus with R6 4.7k pull-up | GREEN | Firmware LED driver bus. |
| 20 XIN | XIN | Y1 12MHz crystal and C13 load cap | YELLOW | C9002 + 33pF first pass, final crystal load review required. |
| 21 XOUT | XOUT | Y1 12MHz crystal and C14 load cap | YELLOW | Keep crystal loop short and guarded by ground. |
| 24 SWCLK | SWCLK | TP10 pogo/test pad | GREEN | Debug/programming access. |
| 25 SWDIO | SWDIO | TP9 pogo/test pad | GREEN | Debug/programming access. |
| 26 RUN | RUN_RESET | SW2 to GND plus TP11 | GREEN | Active-low reset. |
| 46 USB_DM | USB_DM_MCU | R2 27R to connector-side USB_DM_CONN after ESD clamp | GREEN | RP2040 datasheet requires 27R series termination. |
| 47 USB_DP | USB_DP_MCU | R1 27R to connector-side USB_DP_CONN after ESD clamp | GREEN | RP2040 datasheet requires 27R series termination. |
| 51 QSPI_SD3 | FLASH_HOLD_IO3 | U3 pin 7 | GREEN | QSPI IO3 / HOLD. |
| 52 QSPI_SCLK | FLASH_SCLK | U3 pin 6 | GREEN | QSPI clock. |
| 53 QSPI_SD0 | FLASH_IO0_MOSI | U3 pin 5 | GREEN | QSPI IO0 / DI. |
| 54 QSPI_SD2 | FLASH_WP_IO2 | U3 pin 3 | GREEN | QSPI IO2 / WP. |
| 55 QSPI_SD1 | FLASH_IO1_MISO | U3 pin 2 | GREEN | QSPI IO1 / DO. |
| 56 QSPI_CSn | FLASH_CS_N_BOOTSEL | U3 pin 1 and SW1 BOOTSEL to GND | GREEN | Holding CS low at reset enters USB bootloader. |
| 1,10,22,33,42,49 IOVDD | 3V3 | Local 100nF decoupling to GND | GREEN | Digital IO supply. |
| 23,50 DVDD | 3V3 internal regulator domain support | Local decoupling per RP2040 guide | YELLOW | Final schematic should follow RP2040 reference decoupling grouping. |
| 44 VREG_VIN | 3V3/VREG_IN | RP2040 internal regulator input | YELLOW | Confirm against final RP2040 reference design; Rev A2 block-level pin plan only. |
| 45 VREG_VOUT | VREG_OUT | Local decoupling | YELLOW | Confirm exact cap value/placement before order. |
| 48 USB_VDD | 3V3_USB | Local decoupling | GREEN | USB PHY supply. |
| 19 TESTEN | GND | Hard tie to GND | GREEN | Factory test disabled. |
| 57 EP/GND | GND | Exposed pad to solid ground plane with vias | GREEN | Main heat and return path. |

## LP5024RSMR Pin Map

| LP5024 pin | Net | Connection | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 OUT0 | D1_R_TENTATIVE | D1 red cathode candidate | RED | RGB LED pinout must be checked against C2827321 and KiCad footprint. |
| 2 OUT1 | D1_G_TENTATIVE | D1 green cathode candidate | RED | Tentative color order only. |
| 3 OUT2 | D1_B_TENTATIVE | D1 blue cathode candidate | RED | Tentative color order only. |
| 4 OUT3 | D2_R_TENTATIVE | D2 red cathode candidate | RED | Zone 2 of six FIFO sessions. |
| 5 OUT4 | D2_G_TENTATIVE | D2 green cathode candidate | RED | Zone 2 of six FIFO sessions. |
| 6 OUT5 | D2_B_TENTATIVE | D2 blue cathode candidate | RED | Zone 2 of six FIFO sessions. |
| 7 OUT6 | D3_R_TENTATIVE | D3 red cathode candidate | RED | Zone 3 of six FIFO sessions. |
| 8 OUT7 | D3_G_TENTATIVE | D3 green cathode candidate | RED | Zone 3 of six FIFO sessions. |
| 9 OUT8 | D3_B_TENTATIVE | D3 blue cathode candidate | RED | Zone 3 of six FIFO sessions. |
| 10 OUT9 | D4_R_TENTATIVE | D4 red cathode candidate | RED | Zone 4 of six FIFO sessions. |
| 11 OUT10 | D4_G_TENTATIVE | D4 green cathode candidate | RED | Zone 4 of six FIFO sessions. |
| 12 OUT11 | D4_B_TENTATIVE | D4 blue cathode candidate | RED | Zone 4 of six FIFO sessions. |
| 13 OUT12 | D5_R_TENTATIVE | D5 red cathode candidate | RED | Zone 5 of six FIFO sessions. |
| 14 OUT13 | D5_G_TENTATIVE | D5 green cathode candidate | RED | Zone 5 of six FIFO sessions. |
| 15 OUT14 | D5_B_TENTATIVE | D5 blue cathode candidate | RED | Zone 5 of six FIFO sessions. |
| 16 OUT15 | D6_R_TENTATIVE | D6 red cathode candidate | RED | Newest FIFO side. |
| 17 OUT16 | D6_G_TENTATIVE | D6 green cathode candidate | RED | Newest FIFO side. |
| 18 OUT17 | D6_B_TENTATIVE | D6 blue cathode candidate | RED | Newest FIFO side. |
| 19-24 OUT18..OUT23 | NC_RESERVE | No connect or optional test pads | GREEN | TI allows unused outputs to float; reserve for Rev B. |
| 25 ADDR0 | GND | Hard strap low | GREEN | I2C address selection, must not float. |
| 26 ADDR1 | GND | Hard strap low | GREEN | I2C address selection, must not float. |
| 27 VCC | 3V3 | C16 1uF to GND close to U2 | GREEN | Logic supply for LP5024. |
| 28 SDA | I2C0_SDA | RP2040 GPIO4, R5 4.7k to 3V3 | GREEN | I2C data. |
| 29 SCL | I2C0_SCL | RP2040 GPIO5, R6 4.7k to 3V3 | GREEN | I2C clock. |
| 30 EN | LP_EN | R8 10k pull-up to 3V3 | GREEN | Always enabled; firmware can blank channels. |
| 31 IREF | LP_IREF | R7 10k to GND | GREEN | About 7.35mA full-scale sink current before PWM dimming. |
| 32 VCAP | LP_VCAP | C15 1uF to GND close to U2 | GREEN | Required internal LDO output capacitor. |
| Exposed pad | GND | Ground plane and thermal vias | GREEN | Main ground and thermal path. |

## USB-C And ESD Pin Map

| Part pin | Net | Connection | Status | Notes |
| --- | --- | --- | --- | --- |
| J1 A4/B4/A9/B9 | VBUS | USB 5V input, U4 VIN, VLED LED anode rail | GREEN | LED current comes from VBUS/VLED, not through the 3V3 LDO. |
| J1 A1/B1/A12/B12 | GND | Board GND | GREEN | Return for power, USB, ESD, LED driver, MCU. |
| J1 A6/B6 | USB_DP_CONN | U5 pin 1 clamp, R1 27R to RP2040 USB_DP pin 47 | GREEN | USB-C orientation duplicated D+ pins tied together. |
| J1 A7/B7 | USB_DM_CONN | U5 pin 2 clamp, R2 27R to RP2040 USB_DM pin 46 | GREEN | USB-C orientation duplicated D- pins tied together. |
| J1 A5 CC1 | CC1 | R3 5.1k to GND | GREEN | Advertises a USB sink/device. |
| J1 B5 CC2 | CC2 | R4 5.1k to GND | GREEN | Advertises a USB sink/device. |
| J1 SBU1/SBU2 | NC | No connect | GREEN | USB 2.0-only device. |
| J1 shell | SHIELD | Shell-to-ground strategy TBD | YELLOW | Decide direct tie, RC/ESD tie, or chassis strategy after enclosure plan. |
| U5 pin 1 D+ | USB_DP_CONN | Shunt ESD clamp on connector side of R1 | GREEN | DRT package is not an inline 6-pin flow-through part. |
| U5 pin 2 D- | USB_DM_CONN | Shunt ESD clamp on connector side of R2 | GREEN | Must sit near J1 with very short ground return. |
| U5 pin 3 GND | GND | Ground plane/stitching via | GREEN | Corrects Rev A1 footprint risk. |

## QSPI Flash Pin Map

| W25Q32 SOIC-8 pin | Net | RP2040 pin | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 /CS | FLASH_CS_N_BOOTSEL | 56 QSPI_CSn | GREEN | Also connected to BOOTSEL switch to GND. |
| 2 DO/IO1 | FLASH_IO1_MISO | 55 QSPI_SD1 | GREEN | QSPI data 1. |
| 3 /WP/IO2 | FLASH_WP_IO2 | 54 QSPI_SD2 | GREEN | QSPI data 2. |
| 4 GND | GND | GND | GREEN | Local return. |
| 5 DI/IO0 | FLASH_IO0_MOSI | 53 QSPI_SD0 | GREEN | QSPI data 0. |
| 6 CLK | FLASH_SCLK | 52 QSPI_SCLK | GREEN | QSPI clock. |
| 7 /HOLD/IO3 | FLASH_HOLD_IO3 | 51 QSPI_SD3 | GREEN | QSPI data 3. |
| 8 VCC | 3V3 | 3V3 rail | GREEN | 100nF local decoupling. |

## RGB LED Channel Map

| Session slot | Physical emitter | LP5024 channels | Logical FIFO side | Status |
| --- | --- | --- | --- | --- |
| Slot 1 | D1 | OUT0/OUT1/OUT2 | Oldest, left long bar lower cell | RED |
| Slot 2 | D2 | OUT3/OUT4/OUT5 | Oldest, left long bar upper cell | RED |
| Slot 3 | D3 | OUT6/OUT7/OUT8 | Left short lower trapezoid | RED |
| Slot 4 | D4 | OUT9/OUT10/OUT11 | Right short slightly higher trapezoid | RED |
| Slot 5 | D5 | OUT12/OUT13/OUT14 | Newer, right long bar lower cell | RED |
| Slot 6 | D6 | OUT15/OUT16/OUT17 | Newest, right long bar upper cell | RED |

The electrical architecture assumes common-anode RGB LEDs: each LED anode connects to VLED, and each color cathode connects to one LP5024 current sink. The unresolved item is the exact pad-to-color mapping of S4-3528RGBTA-A C2827321 versus the KiCad Wuerth PLCC4 footprint.

## Power And Test Pads

| Net | Source / destination | Status | Notes |
| --- | --- | --- | --- |
| VBUS | USB-C VBUS to U4 VIN and VLED | GREEN | 5V rail from host computer. |
| VLED | VBUS-derived LED anode rail | GREEN | LED current returns through LP5024 OUTx sinks. |
| 3V3 | AP2112K output | GREEN | Supplies RP2040, flash, LP5024 logic, I2C pull-ups. |
| GND | USB, regulator, MCU EP, LP5024 EP, ESD, LED return | GREEN | Use continuous ground plane and stitching around USB/ESD. |
| SWDIO/SWCLK/RUN/3V3/GND | Pogo pads TP9-TP13 | GREEN | Bring-up and programming without hand-soldered headers. |
| VBUS/3V3/GND/SDA/SCL/D+/D-/RUN | Test pads TP1-TP8 | YELLOW | Useful for EVT; placement must clear enclosure. |

## Source Links

- RP2040 datasheet: https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf
- RP2040 hardware design guide: https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf
- TI LP5024 datasheet: https://www.ti.com/lit/ds/symlink/lp5024.pdf
- TI TPD2EUSB30 datasheet: https://www.ti.com/lit/ds/symlink/tpd2eusb30.pdf
- JLCPCB capabilities: https://jlcpcb.com/capabilities/Capabilities
- JLCPCB PCB assembly: https://jlcpcb.com/pcb-assembly
- RP2040 C2040: https://jlcpcb.com/partdetail/RaspberryPi-RP2040/C2040
- LP5024RSMR C427525: https://jlcpcb.com/partdetail/TexasInstruments-LP5024RSMR/C427525
- W25Q32JVSSIQ original C82344: https://jlcpcb.com/partdetail/WINBOND-W25Q32JVSSIQ/C82344
- W25Q32JVSSIQ alternate C179173: https://jlcpcb.com/partdetail/WinbondElec-W25Q32JVSSIQ/C179173
- AP2112K-3.3TRG1 C51118: https://jlcpcb.com/partdetail/DiodesIncorporated-AP2112K33TRG1/C51118
- TPD2EUSB30DRTR C94934: https://jlcpcb.com/partdetail/TexasInstruments-TPD2EUSB30DRTR/C94934
- TYPE-C-31-M-12 C165948: https://jlcpcb.com/partdetail/HRO-TYPE_C_31_M_12/C165948
- S4-3528RGBTA-A C2827321: https://jlcpcb.com/partdetail/OPSCOOptoelectronics-S4_3528RGBTA_A/C2827321
- 27R 0603 C25190: https://jlcpcb.com/partdetail/25933-0603WAF270JT5E/C25190
- 5.1k 0603 C23186: https://jlcpcb.com/partdetail/23913-0603WAF5101T5E/C23186
- 4.7k 0603 C23162: https://www.jlc-smt.com/lcsc/detail?componentCode=C23162
- 10k 0603 C25804: https://www.jlc-smt.com/lcsc/detail?componentCode=C25804
- 100nF 0603 C1591: https://www.lcsc.com/product-detail/C1591.html
- 1uF 0603 C15849: https://jlcpcb.com/partdetail/16531-CL10A105KB8NNNC/C15849
- 10uF 0603 C19702: https://jlcpcb.com/partdetail/20411-CL10A106KP8NNNC/C19702
- 33pF 0603 C2594250: https://jlcpcb.com/partdetail/2686139-CML0603C0G330JT50V/C2594250
- 12MHz 3225 crystal C9002: https://jlcpcb.com/partdetail/YangxingTech-X322512MSB4SI/C9002
- EVQP2R02M switch C79161: https://jlcpcb.com/partdetail/Panasonic-EVQP2R02M/C79161
