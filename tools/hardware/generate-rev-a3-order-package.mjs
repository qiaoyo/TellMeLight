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

const designBomRows = [
  ['Designator', 'Qty', 'Kind', 'Value', 'Footprint', 'Preferred Part', 'JLC Candidate', 'Assembly Side', 'Status', 'Notes'],
  ['U1', '1', 'MCU', 'RP2040', 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'Raspberry Pi RP2040', 'C2040', 'Bottom', 'GREEN', 'USB MCU'],
  ['U2', '1', 'LED_DRIVER', 'LP5024RSMR', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'TI LP5024RSMR', 'C427525', 'Bottom', 'YELLOW', 'JLC color warning is expected because this is an RGB LED driver; confirm pin 1 in orientation preview'],
  ['U3', '1', 'QSPI_FLASH', 'W25Q32JVSSIQ', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', 'Winbond W25Q32JVSSIQ alternate', 'C179173', 'Bottom', 'GREEN', 'Working flash alternate verified by JLC BOM matching'],
  ['U4', '1', 'LDO', 'AP2112K-3.3TRG1', 'Package_TO_SOT_SMD:SOT-23-5', 'Diodes Inc AP2112K-3.3TRG1', 'C51118', 'Bottom', 'GREEN', '3V3 regulator from USB VBUS'],
  ['U5', '1', 'USB_ESD', 'TPD2EUSB30DRTR', 'Package_TO_SOT_SMD:Texas_DRT-3', 'TI TPD2EUSB30DRTR', 'C94934', 'Bottom', 'YELLOW', 'USB D+/D- ESD clamp, orientation preview required'],
  ['U6', '1', 'VLED_TVS', 'TPD1E05U06DPY', 'Package_SON:Texas_DPY0002A_0.6x1mm_P0.65mm', 'TI TPD1E05U06DPYR', 'C436349', 'Bottom', 'YELLOW', 'VLED-to-GND TVS/ESD protection, orientation preview required'],
  ['J1', '1', 'USB_C', 'USB_C_Receptacle_USB2.0', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', 'HRO TYPE-C-31-M-12', 'C165948', 'Bottom', 'YELLOW', 'USB-C connector, shell tied through R9/C17 RC network'],
  ['D1-D6', '6', 'RGB_LED', 'S4-3528RGBTA-A', 'TellMeLight_Rev_A3:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm', 'TUOZHAN S4-3528RGBTA-A', 'C2827321', 'Top', 'YELLOW', 'JLC color warning is expected for RGB; confirm color and orientation preview'],
  ['R1,R2', '2', 'RESISTOR', '27R', 'Resistor_SMD:R_0603_1608Metric', '0603WAF270JT5E', 'C25190', 'Bottom', 'GREEN', 'USB D+/D- series resistors'],
  ['R3,R4', '2', 'RESISTOR', '5.1k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF5101T5E', 'C23186', 'Bottom', 'GREEN', 'USB-C CC pull-downs'],
  ['R5,R6', '2', 'RESISTOR', '4.7k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF4701T5E', 'C23162', 'Bottom', 'GREEN', 'I2C SDA/SCL pull-ups'],
  ['R7,R8', '2', 'RESISTOR', '10k', 'Resistor_SMD:R_0603_1608Metric', '0603WAF1002T5E', 'C25804', 'Bottom', 'GREEN', 'LP5024 IREF and EN support'],
  ['R9', '1', 'RESISTOR', '1M', 'Resistor_SMD:R_0603_1608Metric', '0603WAF1004T5E', 'C22935', 'Bottom', 'GREEN', 'USB-C shell bleed in 1M // 10nF RC network'],
  ['R10', '1', 'RESISTOR', '0R', 'Resistor_SMD:R_0603_1608Metric', '0603WAF0000T5E', 'C21189', 'Bottom', 'GREEN', 'VBUS-to-VLED source link'],
  ['C1-C10', '10', 'CAPACITOR', '100nF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10B104KB8NNNC', 'C1591', 'Bottom', 'GREEN', 'Local decoupling'],
  ['C11,C12', '2', 'CAPACITOR', '10uF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10A106KP8NNNC', 'C19702', 'Bottom', 'GREEN', 'LDO and LED rail bulk'],
  ['C13,C14', '2', 'CAPACITOR', '33pF', 'Capacitor_SMD:C_0603_1608Metric', 'CML0603C0G330JT50V', 'C2594250', 'Bottom', 'YELLOW', 'Working match for C9002 20pF-load 12MHz crystal'],
  ['C15,C16', '2', 'CAPACITOR', '1uF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10A105KB8NNNC', 'C15849', 'Bottom', 'GREEN', 'LP5024 VCAP and VCC capacitors'],
  ['C17', '1', 'CAPACITOR', '10nF', 'Capacitor_SMD:C_0603_1608Metric', 'CL10B103KB8NNNC', 'C57112', 'Bottom', 'GREEN', 'USB-C shell RF shunt in 1M // 10nF RC network'],
  ['Y1', '1', 'CRYSTAL', '12MHz passive', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', 'YXC X322512MSB4SI passive crystal', 'C9002', 'Bottom', 'YELLOW', 'Passive 12MHz crystal; JLC active/passive warning should be confirmed as passive'],
  ['SW1,SW2', '2', 'SWITCH', 'BOOT_RESET', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', 'Panasonic EVQP2R02M', 'C79161', 'Bottom', 'GREEN', 'Back-side service buttons'],
  ['WATERMARK', '1', 'SILKSCREEN', 'avatar watermark', 'F.Silkscreen A1-style separated line art', 'User avatar line art', '', 'Top', 'GREEN', 'Top-side A1-style separated avatar watermark, not an SMT part'],
  ['TP1-TP13', '13', 'TESTPOINT', '1.0mm pad', 'TestPoint:TestPoint_Pad_D1.0mm', 'Generic SMT test pad', '', 'Bottom', 'YELLOW', 'Not a purchased SMT part'],
  ['H1-H4', '4', 'MECHANICAL', 'M2 mounting hole', 'MountingHole:MountingHole_2.2mm_M2', 'Generic M2 clearance', '', 'Mechanical', 'YELLOW', 'Mechanical only'],
];

const jlcBomRows = [
  ['Comment', 'Designator', 'Footprint', 'LCSC Part'],
  ['RP2040', 'U1', 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'C2040'],
  ['LP5024RSMR', 'U2', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'C427525'],
  ['W25Q32JVSSIQ', 'U3', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', 'C179173'],
  ['AP2112K-3.3TRG1', 'U4', 'Package_TO_SOT_SMD:SOT-23-5', 'C51118'],
  ['TPD2EUSB30DRTR', 'U5', 'Package_TO_SOT_SMD:Texas_DRT-3', 'C94934'],
  ['TPD1E05U06DPY', 'U6', 'Package_SON:Texas_DPY0002A_0.6x1mm_P0.65mm', 'C436349'],
  ['TYPE-C-31-M-12', 'J1', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', 'C165948'],
  ['S4-3528RGBTA-A', 'D1,D2,D3,D4,D5,D6', 'TellMeLight_Rev_A3:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm', 'C2827321'],
  ['27R', 'R1,R2', 'Resistor_SMD:R_0603_1608Metric', 'C25190'],
  ['5.1k', 'R3,R4', 'Resistor_SMD:R_0603_1608Metric', 'C23186'],
  ['4.7k', 'R5,R6', 'Resistor_SMD:R_0603_1608Metric', 'C23162'],
  ['10k', 'R7,R8', 'Resistor_SMD:R_0603_1608Metric', 'C25804'],
  ['1M', 'R9', 'Resistor_SMD:R_0603_1608Metric', 'C22935'],
  ['0R', 'R10', 'Resistor_SMD:R_0603_1608Metric', 'C21189'],
  ['100nF', 'C1,C2,C3,C4,C5,C6,C7,C8,C9,C10', 'Capacitor_SMD:C_0603_1608Metric', 'C1591'],
  ['10uF', 'C11,C12', 'Capacitor_SMD:C_0603_1608Metric', 'C19702'],
  ['33pF', 'C13,C14', 'Capacitor_SMD:C_0603_1608Metric', 'C2594250'],
  ['1uF', 'C15,C16', 'Capacitor_SMD:C_0603_1608Metric', 'C15849'],
  ['10nF', 'C17', 'Capacitor_SMD:C_0603_1608Metric', 'C57112'],
  ['12MHz passive crystal', 'Y1', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', 'C9002'],
  ['BOOT_RESET', 'SW1,SW2', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', 'C79161'],
];

const cplRows = [
  ['Designator', 'Mid X', 'Mid Y', 'Layer', 'Rotation'],
  ['D1', '10.800mm', '14.000mm', 'Top', '90'],
  ['D2', '10.800mm', '36.500mm', 'Top', '90'],
  ['D3', '29.000mm', '34.000mm', 'Top', '90'],
  ['D4', '45.500mm', '29.000mm', 'Top', '90'],
  ['D5', '64.000mm', '15.500mm', 'Top', '90'],
  ['D6', '64.000mm', '38.500mm', 'Top', '90'],
  ['U1', '38.000mm', '39.000mm', 'Bottom', '0'],
  ['U2', '38.000mm', '24.000mm', 'Bottom', '0'],
  ['U3', '22.000mm', '39.000mm', 'Bottom', '0'],
  ['U4', '56.000mm', '39.000mm', 'Bottom', '0'],
  ['U5', '29.000mm', '48.000mm', 'Bottom', '0'],
  ['U6', '24.000mm', '48.000mm', 'Bottom', '0'],
  ['J1', '38.000mm', '51.000mm', 'Bottom', '180'],
  ['Y1', '24.000mm', '32.000mm', 'Bottom', '0'],
  ['SW1', '61.000mm', '48.000mm', 'Bottom', '0'],
  ['SW2', '69.000mm', '48.000mm', 'Bottom', '0'],
  ['R1', '32.000mm', '44.000mm', 'Bottom', '0'],
  ['R2', '36.000mm', '44.000mm', 'Bottom', '0'],
  ['R3', '50.000mm', '49.000mm', 'Bottom', '0'],
  ['R4', '55.000mm', '49.000mm', 'Bottom', '0'],
  ['R5', '45.000mm', '28.000mm', 'Bottom', '0'],
  ['R6', '49.000mm', '28.000mm', 'Bottom', '0'],
  ['R7', '34.000mm', '28.000mm', 'Bottom', '0'],
  ['R8', '54.000mm', '28.000mm', 'Bottom', '0'],
  ['R9', '61.000mm', '42.000mm', 'Bottom', '0'],
  ['R10', '47.000mm', '45.000mm', 'Bottom', '0'],
  ['C1', '32.000mm', '36.000mm', 'Bottom', '0'],
  ['C2', '44.000mm', '36.000mm', 'Bottom', '0'],
  ['C3', '32.000mm', '20.000mm', 'Bottom', '0'],
  ['C4', '44.000mm', '20.000mm', 'Bottom', '0'],
  ['C5', '20.000mm', '34.000mm', 'Bottom', '0'],
  ['C6', '56.000mm', '34.000mm', 'Bottom', '0'],
  ['C7', '28.000mm', '44.000mm', 'Bottom', '0'],
  ['C8', '53.000mm', '43.000mm', 'Bottom', '0'],
  ['C9', '25.000mm', '26.000mm', 'Bottom', '0'],
  ['C10', '50.000mm', '22.000mm', 'Bottom', '0'],
  ['C11', '60.000mm', '39.000mm', 'Bottom', '0'],
  ['C12', '62.000mm', '35.000mm', 'Bottom', '0'],
  ['C13', '21.000mm', '28.000mm', 'Bottom', '0'],
  ['C14', '28.000mm', '29.000mm', 'Bottom', '0'],
  ['C15', '31.000mm', '28.000mm', 'Bottom', '0'],
  ['C16', '55.000mm', '22.000mm', 'Bottom', '0'],
  ['C17', '66.000mm', '42.000mm', 'Bottom', '0'],
];

function readinessMarkdown() {
  return `# TellMeLight Rev A3 Order Review

Date: 2026-05-31

Rev A3 is the first compact JLC order-review candidate after the user's JLC dry run.

## What Changed

- Board size reduced to 76 mm x 56 mm.
- U6/R9/C17/R10 are now included in the real PCB placement and JLC BOM/CPL.
- VLED has TVS/ESD protection through U6.
- USB-C shell uses R9 1M and C17 10nF in parallel to GND.
- VBUS-to-VLED is explicit through R10 0R.
- The top-side silkscreen has a small A1-style separated avatar watermark in line art.
- This package checks JLC board size, SMT matching, placement, orientation, and silkscreen. It is still not the paid-order electrical routing release.

## Known JLC Warnings To Interpret

- RGB LED color confirmation for D1-D6 is expected. Confirm it matches RGB three-color C2827321.
- LP5024 color-like warning can appear because the part description includes RGB LED driver language; confirm U2 is C427525.
- Y1 active/passive warning is expected. Confirm C9002 is a passive 12 MHz crystal, not an active oscillator.
- If a row named DESIGNATOR appears as an abnormal component, the JLC importer has treated a header row as a part. Use the Rev A3 files in this package and re-map headers explicitly.

## Stop Before Payment

Do not pay until the JLC orientation preview confirms D1-D6, U2, U5, U6, J1, Y1, SW1, and SW2.

The next hardware step after this review package is a routed Rev A3/A4 PCB generated from the pin-level netlist.
`;
}

function costRows() {
  return [
    ['Item', 'Qty', 'JLC Candidate', 'Status', 'Notes'],
    ['Known Rev A3 JLC dry-run PCB quote', '5', '4-layer 76x56 target', 'estimate pending', 'Rev A2 96x74 quote was about RMB 60; Rev A3 should be lower after size reduction, but final quote must come from JLC'],
    ['Rev A2 SMT dry-run quote', '5', 'economic assembly', 'observed RMB 76 excluding PCB details', 'User observed with official flow template PCB'],
    ['U6 VLED TVS', '1', 'C436349', 'matched in dry run', 'Added to Rev A3 formal BOM/CPL'],
    ['R9 shell bleed', '1', 'C22935', 'matched in dry run', 'Added to Rev A3 formal BOM/CPL'],
    ['C17 shell shunt', '1', 'C57112', 'matched in dry run', 'Added to Rev A3 formal BOM/CPL'],
    ['R10 VLED source link', '1', 'C21189', 'matched in dry run', 'Added to Rev A3 formal BOM/CPL'],
  ];
}

await Promise.all([
  mkdir(bomDir, { recursive: true }),
  mkdir(notesDir, { recursive: true }),
]);

await Promise.all([
  writeFile(join(bomDir, 'rev_a3_bom.csv'), csv(designBomRows), 'utf8'),
  writeFile(join(bomDir, 'rev_a3_jlc_bom.csv'), csv(jlcBomRows), 'utf8'),
  writeFile(join(bomDir, 'rev_a3_jlc_cpl.csv'), csv(cplRows), 'utf8'),
  writeFile(join(bomDir, 'rev_a3_cost_notes.csv'), csv(costRows()), 'utf8'),
  writeFile(join(notesDir, 'rev-a3-order-review.md'), readinessMarkdown(), 'utf8'),
]);

console.log('Generated Rev A3 order-review BOM, CPL, cost notes, and checklist.');
