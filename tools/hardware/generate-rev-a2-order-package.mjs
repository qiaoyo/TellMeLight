import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const repoRoot = process.cwd();
const bomDir = join(repoRoot, 'hardware', 'bom');
const notesDir = join(repoRoot, 'hardware', 'notes');

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

const sourceLinks = [
  ['RP2040 datasheet', 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf'],
  ['RP2040 hardware design guide', 'https://datasheets.raspberrypi.com/rp2040/hardware-design-with-rp2040.pdf'],
  ['TI LP5024 datasheet', 'https://www.ti.com/lit/ds/symlink/lp5024.pdf'],
  ['TI TPD2EUSB30 datasheet', 'https://www.ti.com/lit/ds/symlink/tpd2eusb30.pdf'],
  ['JLCPCB capabilities', 'https://jlcpcb.com/capabilities/Capabilities'],
  ['JLCPCB PCB assembly', 'https://jlcpcb.com/pcb-assembly'],
  ['RP2040 C2040', 'https://jlcpcb.com/partdetail/RaspberryPi-RP2040/C2040'],
  ['LP5024RSMR C427525', 'https://jlcpcb.com/partdetail/TexasInstruments-LP5024RSMR/C427525'],
  ['W25Q32JVSSIQ original C82344', 'https://jlcpcb.com/partdetail/WINBOND-W25Q32JVSSIQ/C82344'],
  ['W25Q32JVSSIQ alternate C179173', 'https://jlcpcb.com/partdetail/WinbondElec-W25Q32JVSSIQ/C179173'],
  ['AP2112K-3.3TRG1 C51118', 'https://jlcpcb.com/partdetail/DiodesIncorporated-AP2112K33TRG1/C51118'],
  ['TPD2EUSB30DRTR C94934', 'https://jlcpcb.com/partdetail/TexasInstruments-TPD2EUSB30DRTR/C94934'],
  ['TYPE-C-31-M-12 C165948', 'https://jlcpcb.com/partdetail/HRO-TYPE_C_31_M_12/C165948'],
  ['S4-3528RGBTA-A C2827321', 'https://jlcpcb.com/partdetail/OPSCOOptoelectronics-S4_3528RGBTA_A/C2827321'],
  ['27R 0603 C25190', 'https://jlcpcb.com/partdetail/25933-0603WAF270JT5E/C25190'],
  ['5.1k 0603 C23186', 'https://jlcpcb.com/partdetail/23913-0603WAF5101T5E/C23186'],
  ['4.7k 0603 C23162', 'https://www.jlc-smt.com/lcsc/detail?componentCode=C23162'],
  ['10k 0603 C25804', 'https://www.jlc-smt.com/lcsc/detail?componentCode=C25804'],
  ['100nF 0603 C1591', 'https://www.lcsc.com/product-detail/C1591.html'],
  ['1uF 0603 C15849', 'https://jlcpcb.com/partdetail/16531-CL10A105KB8NNNC/C15849'],
  ['10uF 0603 C19702', 'https://jlcpcb.com/partdetail/20411-CL10A106KP8NNNC/C19702'],
  ['33pF 0603 C2594250', 'https://jlcpcb.com/partdetail/2686139-CML0603C0G330JT50V/C2594250'],
  ['12MHz 3225 crystal C9002', 'https://jlcpcb.com/partdetail/YangxingTech-X322512MSB4SI/C9002'],
  ['EVQP2R02M switch C79161', 'https://jlcpcb.com/partdetail/Panasonic-EVQP2R02M/C79161'],
];

const designBomRows = [
  ['Designator', 'Qty', 'Kind', 'Value', 'Footprint', 'Preferred Part', 'JLC Candidate', 'Assembly Side', 'Status', 'Notes'],
  ['U1', '1', 'MCU', 'RP2040', 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'Raspberry Pi RP2040', 'C2040', 'Bottom', 'GREEN', 'USB MCU; pin map now documents USB, QSPI, SWD, crystal, RUN, power pins'],
  ['U2', '1', 'LED_DRIVER', 'LP5024RSMR', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'TI LP5024RSMR', 'C427525', 'Bottom', 'YELLOW', 'Kept for Rev A2; VQFN exposed pad, IREF, VCAP, and channel footprint review still required'],
  ['U3', '1', 'QSPI_FLASH', 'W25Q32JVSSIQ', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', 'Winbond W25Q32JVSSIQ alternate', 'C179173', 'Bottom', 'GREEN', 'Rev A2 working alternate because Rev A1 C82344 has stock risk'],
  ['U4', '1', 'LDO', 'AP2112K-3.3TRG1', 'Package_TO_SOT_SMD:SOT-23-5', 'Diodes Inc AP2112K-3.3TRG1', 'C51118', 'Bottom', 'GREEN', '3V3 regulator from USB VBUS; EN tied high to VIN/VBUS'],
  ['U5', '1', 'USB_ESD', 'TPD2EUSB30DRTR', 'Package_TO_SOT_SMD:Texas_DRT-3', 'TI TPD2EUSB30DRTR', 'C94934', 'Bottom', 'YELLOW', 'Rev A2 corrects Rev A1 SOT-23-6 mismatch to KiCad Texas_DRT-3 footprint; orientation still needs JLC review'],
  ['J1', '1', 'USB_C', 'USB_C_Receptacle_USB2.0', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', 'HRO TYPE-C-31-M-12', 'C165948', 'Bottom', 'YELLOW', 'USB-C connector, shell grounding and board-edge mechanical review required'],
  ['D1-D6', '6', 'RGB_LED', 'S4-3528RGBTA-A', 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', 'OPSCO S4-3528RGBTA-A', 'C2827321', 'Top', 'RED', 'RGB LED pinout and selected KiCad footprint pad order must be verified before order'],
  ['R1,R2', '2', 'RESISTOR', '27R', 'Resistor_SMD:R_0603_1608Metric', '0603WAF270JT5E', 'C25190', 'Bottom', 'GREEN', 'USB D+/D- series resistors near RP2040 side of connector-side ESD clamp'],
  ['R3,R4', '2', 'RESISTOR', '5.1k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF5101T5E', 'C23186', 'Bottom', 'GREEN', 'USB-C CC1/CC2 Rd pull-downs to advertise USB device/sink'],
  ['R5,R6', '2', 'RESISTOR', '4.7k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF4701T5E', 'C23162', 'Bottom', 'GREEN', 'I2C SDA/SCL pull-ups to 3V3'],
  ['R7', '1', 'RESISTOR', '10k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF1002T5E', 'C25804', 'Bottom', 'GREEN', 'LP5024 IREF resistor, about 7.35mA full-scale channel current by formula 105*0.7/R'],
  ['R8', '1', 'RESISTOR', '10k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF1002T5E', 'C25804', 'Bottom', 'GREEN', 'LP5024 EN pull-up to 3V3; firmware turns LEDs off through registers'],
  ['C1-C10', '10', 'CAPACITOR', '100nF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10B104KB8NNNC', 'C1591', 'Bottom', 'GREEN', 'Local decoupling near RP2040, flash, regulator, ESD support, and LED driver'],
  ['C11,C12', '2', 'CAPACITOR', '10uF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10A106KP8NNNC', 'C19702', 'Bottom', 'GREEN', 'LDO input/output and LED rail bulk, confirm DC-bias derating in final review'],
  ['C15,C16', '2', 'CAPACITOR', '1uF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10A105KB8NNNC', 'C15849', 'Bottom', 'GREEN', 'LP5024 VCAP and VCC capacitors placed close to U2'],
  ['C13,C14', '2', 'CAPACITOR', '33pF', 'Capacitor_SMD:C_0603_1608Metric', 'CML0603C0G330JT50V', 'C2594250', 'Bottom', 'YELLOW', 'Initial match for C9002 20pF-load 12MHz crystal; verify stray capacitance before release'],
  ['Y1', '1', 'CRYSTAL', '12MHz', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', 'YXC X322512MSB4SI', 'C9002', 'Bottom', 'YELLOW', '12MHz 3225 crystal candidate; final load-cap calculation required'],
  ['SW1,SW2', '2', 'SWITCH', 'BOOT_RESET', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', 'Panasonic EVQP2R02M', 'C79161', 'Bottom', 'GREEN', 'Back-side BOOTSEL and RESET service buttons; JLC searchable and in stock at review time'],
  ['TP1-TP13', '13', 'TESTPOINT', '1.0mm pad', 'TestPoint:TestPoint_Pad_D1.0mm', 'Generic SMT test pad', '', 'Bottom', 'YELLOW', 'Not a purchased SMT part; confirm pogo access and keepout in enclosure'],
  ['H1-H4', '4', 'MECHANICAL', 'M2 mounting hole', 'MountingHole:MountingHole_2.2mm_M2', 'Generic M2 clearance', '', 'Mechanical', 'YELLOW', 'Mechanical only; not in JLC SMT BOM'],
];

const jlcBomRows = [
  ['Comment', 'Designator', 'Footprint', 'LCSC Part'],
  ['RP2040', 'U1', 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'C2040'],
  ['LP5024RSMR', 'U2', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'C427525'],
  ['W25Q32JVSSIQ', 'U3', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', 'C179173'],
  ['AP2112K-3.3TRG1', 'U4', 'Package_TO_SOT_SMD:SOT-23-5', 'C51118'],
  ['TPD2EUSB30DRTR', 'U5', 'Package_TO_SOT_SMD:Texas_DRT-3', 'C94934'],
  ['TYPE-C-31-M-12', 'J1', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', 'C165948'],
  ['S4-3528RGBTA-A', 'D1,D2,D3,D4,D5,D6', 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', 'C2827321'],
  ['27R', 'R1,R2', 'Resistor_SMD:R_0603_1608Metric', 'C25190'],
  ['5.1k', 'R3,R4', 'Resistor_SMD:R_0603_1608Metric', 'C23186'],
  ['4.7k', 'R5,R6', 'Resistor_SMD:R_0603_1608Metric', 'C23162'],
  ['10k', 'R7,R8', 'Resistor_SMD:R_0603_1608Metric', 'C25804'],
  ['100nF', 'C1,C2,C3,C4,C5,C6,C7,C8,C9,C10', 'Capacitor_SMD:C_0603_1608Metric', 'C1591'],
  ['10uF', 'C11,C12', 'Capacitor_SMD:C_0603_1608Metric', 'C19702'],
  ['33pF', 'C13,C14', 'Capacitor_SMD:C_0603_1608Metric', 'C2594250'],
  ['1uF', 'C15,C16', 'Capacitor_SMD:C_0603_1608Metric', 'C15849'],
  ['12MHz', 'Y1', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', 'C9002'],
  ['BOOT_RESET', 'SW1,SW2', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', 'C79161'],
];

const cplRows = [
  ['Designator', 'Mid X', 'Mid Y', 'Layer', 'Rotation'],
  ['D1', '16.500mm', '19.500mm', 'Top', '90'],
  ['D2', '16.500mm', '44.500mm', 'Top', '90'],
  ['D3', '37.500mm', '40.000mm', 'Top', '90'],
  ['D4', '58.500mm', '34.000mm', 'Top', '90'],
  ['D5', '82.000mm', '20.000mm', 'Top', '90'],
  ['D6', '82.000mm', '46.500mm', 'Top', '90'],
  ['U1', '46.000mm', '50.000mm', 'Bottom', '0'],
  ['U2', '46.000mm', '27.000mm', 'Bottom', '0'],
  ['U3', '26.000mm', '50.000mm', 'Bottom', '0'],
  ['U4', '65.000mm', '51.000mm', 'Bottom', '0'],
  ['U5', '37.000mm', '61.000mm', 'Bottom', '0'],
  ['J1', '48.000mm', '66.000mm', 'Bottom', '180'],
  ['Y1', '29.000mm', '42.000mm', 'Bottom', '0'],
  ['SW1', '78.000mm', '57.000mm', 'Bottom', '0'],
  ['SW2', '87.000mm', '57.000mm', 'Bottom', '0'],
  ['R1', '39.000mm', '56.000mm', 'Bottom', '0'],
  ['R2', '43.000mm', '56.000mm', 'Bottom', '0'],
  ['R3', '67.000mm', '62.000mm', 'Bottom', '0'],
  ['R4', '72.000mm', '62.000mm', 'Bottom', '0'],
  ['R5', '54.000mm', '31.000mm', 'Bottom', '0'],
  ['R6', '58.000mm', '31.000mm', 'Bottom', '0'],
  ['R7', '50.000mm', '31.000mm', 'Bottom', '0'],
  ['R8', '62.000mm', '31.000mm', 'Bottom', '0'],
  ['C1', '40.000mm', '44.000mm', 'Bottom', '0'],
  ['C2', '52.000mm', '44.000mm', 'Bottom', '0'],
  ['C3', '40.000mm', '23.000mm', 'Bottom', '0'],
  ['C4', '52.000mm', '23.000mm', 'Bottom', '0'],
  ['C5', '24.000mm', '45.000mm', 'Bottom', '0'],
  ['C6', '68.000mm', '47.000mm', 'Bottom', '0'],
  ['C7', '35.000mm', '58.000mm', 'Bottom', '0'],
  ['C8', '61.000mm', '56.000mm', 'Bottom', '0'],
  ['C9', '31.000mm', '36.000mm', 'Bottom', '0'],
  ['C10', '61.000mm', '36.000mm', 'Bottom', '0'],
  ['C11', '69.000mm', '56.000mm', 'Bottom', '0'],
  ['C12', '68.000mm', '60.000mm', 'Bottom', '0'],
  ['C13', '26.000mm', '38.000mm', 'Bottom', '0'],
  ['C14', '32.000mm', '38.000mm', 'Bottom', '0'],
  ['C15', '41.000mm', '31.000mm', 'Bottom', '0'],
  ['C16', '62.000mm', '27.000mm', 'Bottom', '0'],
];

const costRows = [
  ['Item', 'Qty', 'JLC Candidate', 'Unit USD', 'Extended USD', 'Status', 'Notes'],
  ['RP2040', '1', 'C2040', '0.9854', '0.9854', 'priced', 'Major part price carried from Rev A1 JLC review'],
  ['LP5024RSMR', '1', 'C427525', '1.2622', '1.2622', 'priced', 'Major part price carried from Rev A1 JLC review'],
  ['W25Q32JVSSIQ alternate', '1', 'C179173', '1.4907', '1.4907', 'priced', 'Working Rev A2 flash alternate because C82344 has stock risk'],
  ['AP2112K-3.3TRG1', '1', 'C51118', '0.1622', '0.1622', 'priced', 'Major part price carried from Rev A1 JLC review'],
  ['TPD2EUSB30DRTR', '1', 'C94934', '0.2127', '0.2127', 'priced', 'Footprint corrected to Texas_DRT-3 in Rev A2'],
  ['TYPE-C-31-M-12', '1', 'C165948', '0.1820', '0.1820', 'priced', 'Major part price carried from Rev A1 JLC review'],
  ['S4-3528RGBTA-A', '6', 'C2827321', '0.0310', '0.1860', 'priced', 'RGB LED pinout remains RED blocker before ordering'],
  ['Known priced component subtotal', '1', 'with C179173 alternate flash', '', '4.4812', 'estimate only', 'PCB fabrication, SMT assembly, tooling, tax, and shipping are not included'],
  ['Small passives and switches with exact C-codes', '1', 'C25190/C23186/C23162/C25804/C1591/C19702/C15849/C2594250/C9002/C79161', '', '', 'JLC quote upload required', 'C-codes are searchable; final all-in price must be taken from JLC BOM quote'],
  ['PCB fabrication and SMT assembly', '1', 'JLC quote upload required', '', '', 'unpriced', 'JLC quote upload required'],
  ['Enclosure, diffuser, adhesive, light isolation', '1', 'external mechanical quote required', '', '', 'unpriced', 'Not part of PCB/SMT quote'],
];

function linkList() {
  return sourceLinks.map(([label, url]) => `- ${label}: ${url}`).join('\n');
}

function pinMapMarkdown() {
  return `# TellMeLight Rev A2 Pin Map

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

${linkList()}
`;
}

function sourcingMarkdown() {
  return `# Rev A2 Sourcing Decisions

Date: 2026-05-30

## Decisions

- GREEN: RP2040 stays as U1 with JLC candidate C2040.
- GREEN: LP5024RSMR stays as U2 with JLC candidate C427525. This keeps six independent RGB session slots with true constant-current sinks.
- GREEN: Rev A2 uses W25Q32JVSSIQ C179173 as the working flash alternate.
- YELLOW: Rev A1 selected flash C82344 remains visible for history, but it has stock risk and should not drive the working cost model.
- YELLOW: TPD2EUSB30DRTR C94934 stays, but Rev A2 corrects the KiCad footprint from Rev A1 SOT-23-6 to Texas_DRT-3.
- RED: RGB LED pinout is still the main order blocker. S4-3528RGBTA-A C2827321 is searchable, but its pad/color/common-anode mapping must match the selected KiCad footprint before JLC upload.
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

## Remaining Substitution Rule

If any small component cannot be found during the JLC upload, substitute by matching package, electrical value, tolerance/rating, assembly type, and footprint. Do not silently substitute the RGB LED, LP5024, RP2040, USB-C connector, or USB ESD part because those affect pinout and DFM.
`;
}

function readinessMarkdown() {
  return `# Rev A2 Order Readiness

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
`;
}

function circuitExplanationMarkdown() {
  return `# Rev A2 Circuit Explanation

Date: 2026-05-30

这份说明用于理解当前 TellMeLight Rev A2 电路。现在的 KiCad 仍然是工程基线, 不是最终可下单原理图; 但是这里已经把主要器件、连线和工作原理展开到可以学习和评审的程度。

## 1. 总体结构

TellMeLight 是一个 USB-C 供电的 RP2040 小硬件。电脑通过 USB 和 RP2040 通信, RP2040 再通过 I2C 控制 LP5024RSMR。LP5024RSMR 是 24 路 LED current sink 驱动器, 其中 OUT0 到 OUT17 用来控制 6 个 RGB LED, 每个 session slot 占 3 路颜色通道。

核心电源关系是:

- USB-C 的 VBUS 提供 5V。
- 5V 直接作为 VLED, 供给 RGB LED 的公共阳极。
- AP2112K-3.3TRG1 把 5V 转成 3V3。
- 3V3 供 RP2040、QSPI flash、LP5024RSMR 逻辑、电阻上拉等低压数字电路。

这样做的好处是 LED 电流不经过 3V3 LDO, LDO 只承担逻辑电流, 发热更可控。

## 2. USB-C 入口

J1 是 USB-C 2.0 连接器。A4/B4/A9/B9 接 VBUS, A1/B1/A12/B12 接 GND。A6/B6 是 D+, A7/B7 是 D-。因为 USB-C 插头可以正反插, 连接器内有两组 D+/D- 焊盘, 设计上会把同名焊盘并到同一根 USB_DP_CONN / USB_DM_CONN。

CC1 和 CC2 各接一个 5.1k 电阻到 GND。这个 5.1k 叫 Rd, 它告诉上游 USB-C 供电设备: 我是一个需要供电的 USB device/sink。没有这个电阻, 很多 USB-C 电源不会给 VBUS。

SBU1/SBU2 在 USB 2.0 设备里不用, 先不连接。

## 3. USB ESD 与 27R 串联电阻

U5 是 TPD2EUSB30DRTR。Rev A2 的一个关键修正是: 这个器件是 3-pin DRT 封装, 不是 6-pin flow-through 封装。它的 pin 1 接 D+, pin 2 接 D-, pin 3 接 GND。

它的工作方式不是让 USB 信号从一边进另一边出, 而是在 D+/D- 到 GND 之间提供很低电容的 ESD 泄放路径。静电打进 USB 口时, 能量优先通过 U5 回到地, 保护 RP2040 的 USB pins。

R1/R2 是 27R 串联电阻, 分别在 D+ 和 D- 上。RP2040 datasheet 要求 USB_DP/USB_DM 每根线上有 27R series termination。实际走线顺序应该是:

USB-C connector -> connector-side ESD clamp -> 27R series resistor -> RP2040 USB_DP/USB_DM。

## 4. RP2040 主控

U1 是 RP2040。它负责:

- USB device 通信。
- 读取 host 发送的 session 状态。
- 在 firmware 里把 running/approval/done/error/idle 映射成亮度和颜色。
- 通过 I2C 控制 LP5024RSMR。
- 通过 QSPI flash 启动和存储固件。

关键引脚:

- USB_DM pin 46, USB_DP pin 47: 接 USB 数据线。
- GPIO4 pin 6: I2C SDA。
- GPIO5 pin 7: I2C SCL。
- QSPI_SD0..3, QSPI_SCLK, QSPI_CSn: 接外部 flash。
- XIN/XOUT pin 20/21: 接 12MHz 晶振。
- SWCLK pin 24, SWDIO pin 25: 调试和烧录。
- RUN pin 26: 低电平复位。
- TESTEN pin 19: 必须接 GND, 避免进入工厂测试模式。

## 5. QSPI flash

U3 是 W25Q32JVSSIQ。RP2040 没有内置大容量 flash, 固件从外部 QSPI flash 运行或加载。

SOIC-8 flash 的连接是:

- /CS -> RP2040 QSPI_CSn。
- CLK -> RP2040 QSPI_SCLK。
- IO0/DI -> RP2040 QSPI_SD0。
- IO1/DO -> RP2040 QSPI_SD1。
- IO2/WP -> RP2040 QSPI_SD2。
- IO3/HOLD -> RP2040 QSPI_SD3。
- VCC -> 3V3, GND -> GND。

BOOTSEL 按钮会在复位时把 QSPI_CSn 拉低, 让 RP2040 进入 USB bootloader, 这样可以从电脑重新刷固件。

## 6. LP5024RSMR LED driver

U2 是 LP5024RSMR。它的 OUT0 到 OUT23 都是 current sink, 中文可以理解成"恒流下拉端"。LED 的公共阳极接 VLED, 每个颜色阴极接到一个 OUT pin。当 LP5024 打开某一路 OUT, 电流从 VLED 经过 LED 流入 LP5024, 再回到 GND。

这种结构比直接用 MCU GPIO 推 LED 更适合产品:

- 每个颜色通道电流更一致。
- RP2040 不需要承担 LED 电流。
- LP5024 有 PWM 和颜色控制寄存器, 呼吸灯/持续亮/等待批准等状态更容易做。

Rev A2 使用 OUT0..OUT17 对应 6 个 RGB LED。OUT18..OUT23 保留。ADDR0/ADDR1 接 GND, 让 I2C 地址固定。SDA/SCL 接 RP2040 的 GPIO4/GPIO5, R5/R6 4.7k 上拉到 3V3。

IREF pin 接 R7 10k 到 GND, 决定 LP5024 的满量程电流。公式是 RIREF = 105 * 0.7V / ISET。10k 大约得到 7.35mA, 比 15mA 更保守, 适合先做一个不会太刺眼、也不容易过热的原型。

VCAP pin 必须接 1uF 到 GND, VCC 也建议 1uF 到 GND, 并且都要靠近 U2。

## 7. RGB LED 六格

D1-D6 是六个 RGB LED, 对应 FIFO 的六个 session slot。新的 session 从最右侧进入, 旧 session 向左移动, 超过六个时最老的被挤掉。

当前通道计划:

- D1: OUT0/OUT1/OUT2。
- D2: OUT3/OUT4/OUT5。
- D3: OUT6/OUT7/OUT8。
- D4: OUT9/OUT10/OUT11。
- D5: OUT12/OUT13/OUT14。
- D6: OUT15/OUT16/OUT17。

这里还有 RED blocker: S4-3528RGBTA-A 的 pad/color/common-anode pinout 必须和 KiCad footprint 一一匹配。只要这个没确认, 就不能下单。

## 8. 电源和去耦

AP2112K-3.3TRG1 把 USB 5V 转成 3V3。C11/C12 这类 10uF 电容用于 LDO 输入/输出和电源缓冲。C1-C10 的 100nF 电容用于各 IC 附近的高频去耦。

去耦电容的作用是给芯片瞬时电流一个很短的本地回路。如果没有这些小电容, USB/I2C/QSPI/PWM 边沿会让电源线上出现尖峰或下陷, 轻则不稳定, 重则 USB 枚举失败或 MCU reset。

## 9. 调试和测试

TP9/TP10 是 SWDIO/SWCLK, 可以用调试器烧录和调试。TP11 是 RUN reset, TP12 是 3V3, TP13 是 GND。TP1-TP8 是 bring-up 测试点, 用于测 VBUS、3V3、GND、I2C、USB、RUN 等关键网络。

这些测试点的目标是: 不需要焊接排针, 也能在硬件回来后定位问题。

## 10. 当前不能下单的原因

- RGB LED pinout 仍是 RED。
- JLC SMT placement/orientation preview 还没人工确认。
- USB-C shell grounding 需要结合外壳和装饰面板决定。
- 晶振和 33pF 负载电容是第一版候选, 还需要最终负载电容计算。

这些不是坏消息, 反而是 A2 最重要的价值: 把风险摊在桌面上, 让后面的 PCB 下单不会靠猜。
`;
}

async function main() {
  await Promise.all([
    mkdir(bomDir, { recursive: true }),
    mkdir(notesDir, { recursive: true }),
  ]);

  await Promise.all([
    writeFile(join(notesDir, 'rev-a2-pin-map.md'), pinMapMarkdown(), 'utf8'),
    writeFile(join(notesDir, 'rev-a2-sourcing-decisions.md'), sourcingMarkdown(), 'utf8'),
    writeFile(join(notesDir, 'rev-a2-order-readiness.md'), readinessMarkdown(), 'utf8'),
    writeFile(join(notesDir, 'rev-a2-circuit-explanation.md'), circuitExplanationMarkdown(), 'utf8'),
    writeFile(join(bomDir, 'rev_a2_bom.csv'), csv(designBomRows), 'utf8'),
    writeFile(join(bomDir, 'rev_a2_jlc_bom.csv'), csv(jlcBomRows), 'utf8'),
    writeFile(join(bomDir, 'rev_a2_jlc_cpl.csv'), csv(cplRows), 'utf8'),
    writeFile(join(bomDir, 'rev_a2_cost_estimate.csv'), csv(costRows), 'utf8'),
  ]);

  console.log('Generated Rev A2 order package notes, BOM, CPL, and cost estimate.');
}

await main();
