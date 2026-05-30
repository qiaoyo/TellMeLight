import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const repoRoot = process.cwd();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const kicadRoot = process.env.KICAD_ROOT ?? 'E:\\kicad';
const kicadPython = process.env.KICAD_PYTHON ?? join(kicadRoot, 'bin', 'python.exe');

const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a1');
const bomDir = join(repoRoot, 'hardware', 'bom');
const simulationDir = join(repoRoot, 'hardware', 'simulation');
const notesDir = join(repoRoot, 'hardware', 'notes');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a1');

const projectPath = join(projectDir, 'tellmelight_rev_a1.kicad_pro');
const schematicPath = join(projectDir, 'tellmelight_rev_a1.kicad_sch');
const symbolLibraryPath = join(projectDir, 'tellmelight_rev_a1.kicad_sym');
const symLibTablePath = join(projectDir, 'sym-lib-table');
const readmePath = join(projectDir, 'README.md');
const bomPath = join(bomDir, 'rev_a1_bom.csv');
const sourcingPath = join(bomDir, 'rev_a1_jlc_sourcing.csv');
const powerCsvPath = join(simulationDir, 'rev_a1_power_budget.csv');
const powerMdPath = join(simulationDir, 'rev_a1_power_budget.md');
const readinessPath = join(notesDir, 'rev-a1-jlc-readiness.md');
const boardPath = join(projectDir, 'tellmelight_rev_a1.kicad_pcb');

async function ensureDirs() {
  await Promise.all([
    mkdir(projectDir, { recursive: true }),
    mkdir(bomDir, { recursive: true }),
    mkdir(simulationDir, { recursive: true }),
    mkdir(notesDir, { recursive: true }),
    mkdir(outputsDir, { recursive: true }),
  ]);
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function schEscape(text) {
  return String(text).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function schematicText(text, x, y, size = 1.5) {
  return `\t(text "${schEscape(text)}"\n`
    + '\t\t(exclude_from_sim no)\n'
    + `\t\t(at ${x} ${y} 0)\n`
    + '\t\t(effects\n'
    + '\t\t\t(font\n'
    + `\t\t\t\t(size ${size} ${size})\n`
    + '\t\t\t)\n'
    + '\t\t\t(justify left bottom)\n'
    + '\t\t)\n'
    + `\t\t(uuid "${randomUUID()}")\n`
    + '\t)\n';
}

function schematicProperty(name, value, x, y, hide = false, indent = '\t\t') {
  return `${indent}(property "${schEscape(name)}" "${schEscape(value)}"\n`
    + `${indent}\t(at ${x} ${y} 0)\n`
    + `${indent}\t(effects\n`
    + `${indent}\t\t(font\n`
    + `${indent}\t\t\t(size 1.27 1.27)\n`
    + `${indent}\t\t)\n`
    + (hide ? `${indent}\t\t(hide yes)\n` : '')
    + `${indent}\t)\n`
    + `${indent})\n`;
}

function schematicPartSymbolDefinition() {
  return `\t\t(symbol "TellMeLight:Part"
\t\t\t(exclude_from_sim no)
\t\t\t(in_bom yes)
\t\t\t(on_board yes)
${schematicProperty('Reference', 'U', 0, 4, false, '\t\t\t')}${schematicProperty('Value', 'Part', 0, -4, false, '\t\t\t')}${schematicProperty('Footprint', '', 0, 0, true, '\t\t\t')}${schematicProperty('Datasheet', '', 0, 0, true, '\t\t\t')}${schematicProperty('Description', 'TellMeLight Rev A1 BOM review symbol', 0, 0, true, '\t\t\t')}\t\t\t(symbol "Part_0_1"
\t\t\t\t(rectangle
\t\t\t\t\t(start -6 3)
\t\t\t\t\t(end 6 -3)
\t\t\t\t\t(stroke
\t\t\t\t\t\t(width 0.15)
\t\t\t\t\t\t(type default)
\t\t\t\t\t)
\t\t\t\t\t(fill
\t\t\t\t\t\t(type background)
\t\t\t\t\t)
\t\t\t\t)
\t\t\t)
\t\t)
`;
}

function symbolLibraryFile() {
  const symbol = schematicPartSymbolDefinition().replace(/^\t\t/gm, '\t');
  return `(kicad_symbol_lib
\t(version 20241209)
\t(generator "kicad_symbol_editor")
\t(generator_version "10.0.3")
${symbol})
`;
}

function symLibTableFile() {
  return `(sym_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a1.kicad_sym")
\t\t(options "")
\t\t(descr "TellMeLight Rev A1 local schematic symbols")
\t)
)
`;
}

function schematicPartInstance(part, rootUuid) {
  return `\t(symbol
\t\t(lib_id "TellMeLight:Part")
\t\t(at ${part.x} ${part.y} 0)
\t\t(unit 1)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
\t\t(dnp no)
\t\t(uuid "${randomUUID()}")
${schematicProperty('Reference', part.ref, part.x, part.y - 5, false, '\t\t')}${schematicProperty('Value', part.value, part.x, part.y + 5, false, '\t\t')}${schematicProperty('Footprint', part.footprint, part.x, part.y, true, '\t\t')}${schematicProperty('Datasheet', part.datasheet ?? '', part.x, part.y, true, '\t\t')}${schematicProperty('Description', part.description ?? '', part.x, part.y, true, '\t\t')}\t\t(instances
\t\t\t(project "tellmelight_rev_a1"
\t\t\t\t(path "/${rootUuid}"
\t\t\t\t\t(reference "${schEscape(part.ref)}")
\t\t\t\t\t(unit 1)
\t\t\t\t)
\t\t\t)
\t\t)
\t)
`;
}

function projectFile() {
  return `${JSON.stringify({
    board: {
      design_settings: {
        defaults: {
          board_outline_line_width: 0.1,
          copper_line_width: 0.2,
          courtyard_line_width: 0.05,
          fab_line_width: 0.1,
          silk_line_width: 0.15,
          zones: { min_clearance: 0.2 },
        },
        meta: { version: 2 },
        rule_severities: {
          courtyard_overlap: 'warning',
          invalid_outline: 'error',
          silk_edge_clearance: 'warning',
          unconnected_items: 'warning',
        },
        rules: {
          allow_blind_buried_vias: false,
          allow_microvias: false,
          min_clearance: 0.15,
          min_copper_edge_clearance: 0.25,
          min_track_width: 0.127,
          min_via_diameter: 0.45,
          min_via_drill: 0.2,
        },
      },
      layer_presets: [],
      viewports: [],
    },
    boards: [],
    cvpcb: { equivalence_files: [] },
    erc: {
      erc_exclusions: [],
      meta: { version: 0 },
    },
    libraries: {
      pinned_footprint_libs: [],
      pinned_symbol_libs: [],
    },
    meta: {
      filename: 'tellmelight_rev_a1.kicad_pro',
      version: 1,
    },
    net_settings: {
      classes: [
        {
          bus_width: 12,
          clearance: 0.15,
          diff_pair_gap: 0.25,
          diff_pair_via_gap: 0.25,
          diff_pair_width: 0.2,
          line_style: 0,
          microvia_diameter: 0.3,
          microvia_drill: 0.1,
          name: 'Default',
          pcb_color: 'rgba(0, 0, 0, 0.000)',
          schematic_color: 'rgba(0, 0, 0, 0.000)',
          track_width: 0.2,
          via_diameter: 0.45,
          via_drill: 0.2,
          wire_width: 6,
        },
      ],
      meta: { version: 3 },
      net_colors: null,
    },
    pcbnew: {
      page_layout_descr_file: '',
    },
    schematic: {
      annotate_start_num: 0,
      bom_fmt_presets: [],
      bom_fmt_settings: {},
      drawing: {
        default_line_thickness: 6,
        default_text_size: 50,
      },
      page_layout_descr_file: '',
    },
    sheets: [
      [randomUUID(), 'Root'],
    ],
    text_variables: {
      product: 'TellMeLight',
      revision: 'Rev A1',
    },
  }, null, 2)}\n`;
}

function schematicFile() {
  const rootUuid = randomUUID();
  const notes = [
    ['TellMeLight Rev A1 JLC-oriented schematic baseline', 20, 24, 2.2],
    ['USB-C J1: VBUS enters protected 5V rail; CC1/CC2 use 5.1k Rd pull-downs.', 20, 36, 1.3],
    ['USB data: J1 D+/D- -> TPD2EUSB30 U5 -> 27R series resistors -> RP2040 U1 USB pins.', 20, 44, 1.3],
    ['Power: VBUS -> AP2112K-3.3 U4 -> 3V3 for RP2040, flash, and LP5024 logic.', 20, 52, 1.3],
    ['MCU: RP2040 U1 uses W25Q32JVSSIQ U3 QSPI flash, 12 MHz Y1, pogo SWD pads, BOOT SW1, RESET SW2.', 20, 60, 1.3],
    ['LED driver: RP2040 I2C0 SDA/SCL -> LP5024 U2 with 4.7k pull-ups to 3V3.', 20, 68, 1.3],
    ['Light zones: LP5024 OUT0..OUT17 sink six common-anode 3528 RGB LEDs D1..D6 from VLED.', 20, 76, 1.3],
    ['Reserved: LP5024 OUT18..OUT23 are kept for Rev B brightness or status expansion.', 20, 84, 1.3],
    ['Manufacturing: 4-layer board, double-sided SMT, no assumed user hand-soldering.', 20, 92, 1.2],
    ['This file is the Rev A1 block-level schematic/net plan. Pin-by-pin signoff remains a review item.', 20, 100, 1.1],
  ];
  const parts = [
    { ref: 'U1', value: 'RP2040', footprint: 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', description: 'USB MCU', x: 25, y: 118 },
    { ref: 'U2', value: 'LP5024RSMR', footprint: 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', description: '24-channel RGB LED driver', x: 65, y: 118 },
    { ref: 'U3', value: 'W25Q32JVSSIQ', footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', description: 'QSPI flash', x: 105, y: 118 },
    { ref: 'U4', value: 'AP2112K-3.3TRG1', footprint: 'Package_TO_SOT_SMD:SOT-23-5', description: '3V3 regulator', x: 145, y: 118 },
    { ref: 'U5', value: 'TPD2EUSB30DRTR', footprint: 'Package_TO_SOT_SMD:SOT-23-6', description: 'USB ESD protection', x: 25, y: 138 },
    { ref: 'J1', value: 'USB_C_Receptacle_USB2.0', footprint: 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', description: 'USB-C connector', x: 65, y: 138 },
    { ref: 'TP9', value: 'TP_SWDIO', footprint: 'TestPoint:TestPoint_Pad_D1.0mm', description: 'Pogo SWDIO pad', x: 105, y: 138 },
    { ref: 'TP10', value: 'TP_SWCLK', footprint: 'TestPoint:TestPoint_Pad_D1.0mm', description: 'Pogo SWCLK pad', x: 145, y: 138 },
    { ref: 'TP11', value: 'TP_RUN', footprint: 'TestPoint:TestPoint_Pad_D1.0mm', description: 'Pogo RUN pad', x: 25, y: 158 },
    { ref: 'TP12', value: 'TP_3V3', footprint: 'TestPoint:TestPoint_Pad_D1.0mm', description: 'Pogo 3V3 pad', x: 65, y: 158 },
    { ref: 'TP13', value: 'TP_GND', footprint: 'TestPoint:TestPoint_Pad_D1.0mm', description: 'Pogo ground pad', x: 105, y: 158 },
    { ref: 'SW1', value: 'BOOT', footprint: 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', description: 'BOOTSEL switch', x: 145, y: 158 },
    { ref: 'SW2', value: 'RESET', footprint: 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', description: 'Reset switch', x: 25, y: 178 },
    { ref: 'Y1', value: '12MHz', footprint: 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', description: 'RP2040 crystal', x: 65, y: 178 },
    { ref: 'D1', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 1 emitter', x: 105, y: 178 },
    { ref: 'D2', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 2 emitter', x: 145, y: 178 },
    { ref: 'D3', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 3 emitter', x: 25, y: 198 },
    { ref: 'D4', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 4 emitter', x: 65, y: 198 },
    { ref: 'D5', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 5 emitter', x: 105, y: 198 },
    { ref: 'D6', value: 'S4-3528RGBTA-A', footprint: 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', description: 'Session zone 6 emitter', x: 145, y: 198 },
  ];

  return `(kicad_sch
\t(version 20250114)
\t(generator "eeschema")
\t(generator_version "10.0.3")
\t(uuid "${rootUuid}")
\t(paper "A4")
\t(title_block
\t\t(title "TellMeLight Rev A1")
\t\t(date "2026-05-30")
\t\t(rev "A1")
\t\t(company "TellMeLight")
\t\t(comment 1 "USB-C RP2040 + LP5024 six-zone AI session light")
\t\t(comment 2 "JLC-oriented block-level schematic generated by tools/hardware/generate-rev-a1-kicad.mjs")
\t)
${notes.map(([text, x, y, size]) => schematicText(text, x, y, size)).join('')}${schematicText('Review symbols below represent selected Rev A1 components; wiring still follows the net-plan notes above.', 20, 112, 1.0)}\t(lib_symbols
${schematicPartSymbolDefinition()}\t)
${parts.map((part) => schematicPartInstance(part, rootUuid)).join('')}
\t(sheet_instances
\t\t(path "/"
\t\t\t(page "1")
\t\t)
\t)
\t(embedded_fonts no)
)
`;
}

function bomFile() {
  return csv([
    ['Designator', 'Qty', 'Kind', 'Value', 'Footprint', 'Preferred Part', 'JLC Candidate', 'Assembly Side', 'Notes', 'Status'],
    ['U1', '1', 'MCU', 'RP2040', 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'Raspberry Pi RP2040', 'C2040', 'Bottom', 'USB device controller; QFN-56 7x7 mm', 'review'],
    ['U2', '1', 'LED_DRIVER', 'LP5024RSMR', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'TI LP5024RSMR', 'C427525', 'Bottom', '24-channel I2C RGB LED driver; 18 channels used', 'review'],
    ['U3', '1', 'FLASH', 'W25Q32JVSSIQ', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', 'Winbond W25Q32JVSSIQ', 'C82344', 'Bottom', 'QSPI flash for RP2040 firmware', 'review'],
    ['U4', '1', 'LDO', 'AP2112K-3.3TRG1', 'Package_TO_SOT_SMD:SOT-23-5', 'Diodes Inc AP2112K-3.3TRG1', 'C51118', 'Bottom', '3V3 regulator from USB VBUS', 'review'],
    ['U5', '1', 'USB_ESD', 'TPD2EUSB30DRTR', 'Package_TO_SOT_SMD:SOT-23-6', 'TI TPD2EUSB30DRTR', 'C94934', 'Bottom', 'USB D+/D- ESD protection near J1', 'review'],
    ['J1', '1', 'USB_C', 'USB_C_Receptacle_USB2.0', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', 'HRO TYPE-C-31-M-12', 'C165948', 'Bottom', 'USB-C power and full-speed data', 'review'],
    ['TP_SWDIO,TP_SWCLK,TP_RUN,TP_3V3,TP_GND', '5', 'DEBUG', 'Pogo test pads', 'TestPoint:TestPoint_Pad_D1.0mm', 'Generic 1.0 mm SMT test pad', 'JLC basic mechanical', 'Bottom', 'SWDIO, SWCLK, RUN, 3V3, GND without a through-hole header', 'review'],
    ['SW1,SW2', '2', 'SWITCH', 'BOOT_RESET', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', 'Panasonic EVQP2-class', 'JLC matched switch', 'Bottom', 'BOOTSEL and reset service buttons on back', 'review'],
    ['Y1', '1', 'CRYSTAL', '12MHz', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', '12 MHz 3.2x2.5 mm crystal', 'JLC matched crystal', 'Bottom', 'RP2040 clock source; validate load caps with selected crystal', 'review'],
    ['D1-D6', '6', 'RGB_LED', 'S4-3528RGBTA-A', 'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100', 'OPSCO S4-3528RGBTA-A', 'C2827321', 'Top', 'Common-anode RGB emitters under diffuser bars', 'review'],
    ['R1,R2', '2', 'RESISTOR', '27R', 'Resistor_SMD:R_0603_1608Metric', '1% 0603 resistor', 'JLC basic 0603', 'Bottom', 'USB D+/D- series resistors', 'review'],
    ['R3,R4', '2', 'RESISTOR', '5.1k', 'Resistor_SMD:R_0603_1608Metric', '1% 0603 resistor', 'JLC basic 0603', 'Bottom', 'USB-C CC pull-downs', 'review'],
    ['R5,R6', '2', 'RESISTOR', '4.7k', 'Resistor_SMD:R_0603_1608Metric', '1% 0603 resistor', 'JLC basic 0603', 'Bottom', 'I2C pull-ups to 3V3', 'review'],
    ['C1-C10', '10', 'CAPACITOR', '100nF', 'Capacitor_SMD:C_0603_1608Metric', 'X7R 0603 capacitor', 'JLC basic 0603', 'Bottom', 'Local IC decoupling', 'review'],
    ['C11,C12', '2', 'CAPACITOR', '10uF', 'Capacitor_SMD:C_0603_1608Metric', 'X5R/X7R 0603 or 0805 capacitor', 'JLC basic/common', 'Bottom', 'LDO input/output and LED rail bulk', 'review'],
    ['C13,C14', '2', 'CAPACITOR', 'Crystal load', 'Capacitor_SMD:C_0603_1608Metric', 'Load capacitor matched to selected crystal', 'JLC matched capacitor', 'Bottom', 'RP2040 crystal load caps', 'review'],
    ['TP1-TP8', '8', 'TESTPOINT', '1.0mm pad', 'TestPoint:TestPoint_Pad_D1.0mm', 'Generic 1.0 mm SMT test pad', 'JLC basic mechanical', 'Bottom', 'VBUS, 3V3, GND, I2C, USB, RUN bring-up points', 'review'],
    ['H1-H4', '4', 'MECHANICAL', 'M2 mounting hole', 'MountingHole:MountingHole_2.2mm_M2', 'Generic M2 clearance', 'Not assembled', 'Mechanical', 'Optional enclosure/diffuser fastening', 'review'],
  ]);
}

function sourcingFile() {
  return csv([
    ['Designator', 'Preferred Part', 'JLC Candidate', 'Library Status', 'Assembly Risk', 'Action Before Order'],
    ['U1', 'Raspberry Pi RP2040', 'C2040', 'JLC partdetail verified 2026-05-30', 'QFN-56 exposed pad', 'Review RP2040 hardware design recommendations and thermal pad stencil'],
    ['U2', 'TI LP5024RSMR', 'C427525', 'JLC partdetail verified 2026-05-30', 'VQFN-32 exposed pad and fine pitch', 'Review LP5024 footprint, paste windowing, I2C address strap, and channel pinout'],
    ['U3', 'Winbond W25Q32JVSSIQ', 'C82344', 'JLC partdetail verified 2026-05-30', 'SOIC-8 low risk', 'Confirm RP2040 QSPI pin mapping before release'],
    ['U4', 'Diodes Inc AP2112K-3.3TRG1', 'C51118', 'JLC partdetail verified 2026-05-30', 'SOT-23-5 low risk', 'Confirm input/output capacitor ESR and voltage rating'],
    ['U5', 'TI TPD2EUSB30DRTR', 'C94934', 'JLC partdetail verified 2026-05-30', 'Small USB ESD package', 'Place near USB-C connector and confirm pad numbering'],
    ['J1', 'HRO TYPE-C-31-M-12', 'C165948', 'JLC partdetail verified 2026-05-30', 'Connector mechanical alignment and shell paste', 'Check USB-C footprint, shell grounding, and board-edge keepout'],
    ['D1-D6', 'OPSCO S4-3528RGBTA-A', 'C2827321', 'JLC partdetail verified 2026-05-30', 'RGB pinout must match selected footprint', 'Verify common-anode pin mapping against final datasheet before ordering'],
    ['R/C passives', '0603 JLC basic/common families', 'JLC basic/common', 'Use BOM matching at order time', 'Low', 'Lock exact C-codes after price/stock review'],
    ['Y1', '12 MHz 3.2 x 2.5 mm crystal', 'JLC matched crystal', 'Use BOM matching at order time', 'Load cap value depends on crystal CL', 'Pick final crystal and capacitor values together'],
    ['SW1,SW2', 'SMD tactile service buttons', 'JLC matched switch', 'Use BOM matching at order time', 'Service controls on back only', 'Confirm height clears enclosure and diffuser stack'],
  ]);
}

function powerRows() {
  return [
    ['Scenario', '3V3 load mA', 'LED channels on', 'LED current per channel mA', 'LED rail current mA', 'Approx USB current mA', 'LDO dissipation mW', 'Notes'],
    ['Idle off', '38', '0', '0', '0', '38', '65', 'MCU, flash standby, LED driver logic; all visible zones off'],
    ['Typical visible load', '45', '18', '5', '90', '135', '77', 'Six RGB zones at a restrained 5 mA/channel steady equivalent'],
    ['Breathing peak', '50', '18', '10', '180', '230', '85', 'Firmware should use PWM breathing below this peak most of the time'],
    ['Worst-case all channels', '70', '18', '20', '360', '430', '119', 'Below 500 mA USB target but too bright/thermal for default firmware'],
  ];
}

function powerMarkdown() {
  return `# Rev A1 Power Budget Simulation

Date: 2026-05-30

This is a local engineering current budget for the KiCad Rev A1 JLC-oriented baseline. It is not a SPICE model.

USB current target: keep normal operation comfortably below 500 mA.

| Scenario | 3V3 load | LED channels on | LED current/channel | LED rail current | Approx USB current | LDO dissipation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Idle off | 38 mA | 0 | 0 mA | 0 mA | 38 mA | 65 mW |
| Typical visible load | 45 mA | 18 | 5 mA | 90 mA | 135 mA | 77 mW |
| Breathing peak | 50 mA | 18 | 10 mA | 180 mA | 230 mA | 85 mW |
| Worst-case all channels | 70 mA | 18 | 20 mA | 360 mA | 430 mA | 119 mW |

## Interpretation

- Typical visible load keeps the device comfortably inside the USB current target.
- Worst-case all channels still fits the target budget on paper, but firmware should cap default brightness well below that state.
- The AP2112K-class LDO only supplies 3V3 logic current; LED current is budgeted on the USB VBUS LED rail.
- The S4-3528RGBTA-A RGB LED candidate remains a sample-and-review item because optical output and diffuser losses will drive the final current limit.
`;
}

function designReadme() {
  return `# TellMeLight Rev A1 KiCad Project

Generated: 2026-05-30

## Contents

- \`tellmelight_rev_a1.kicad_pro\`: KiCad project.
- \`tellmelight_rev_a1.kicad_sch\`: block-level schematic/net plan for Rev A1.
- \`tellmelight_rev_a1.kicad_sym\` and \`sym-lib-table\`: local symbols so KiCad can export a review BOM.
- \`tellmelight_rev_a1.kicad_pcb\`: 4-layer PCB floorplan with stock KiCad footprints.

## Important Boundary

This is a Rev A1 JLC-oriented CAD baseline for review. It is not a fabrication release until the pin-by-pin schematic, routing, footprint models, JLC BOM matching, and DFM are reviewed.

## Manufacturing Direction

- 4-layer PCB.
- Double-sided SMT assembly.
- No assumed user hand-soldering.
- Pogo/test pads replace the visible SWD header direction.
- Front side is kept mostly optical; back side carries logic, USB, power, and service controls.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
`;
}

function readinessMarkdown() {
  return `# Rev A1 JLC Readiness Notes

Date: 2026-05-30

Rev A1 is a local fabrication-candidate baseline, not an order release.

## Confirmed Direction

- No assumed user hand-soldering.
- JLC DFM review before ordering.
- double-sided SMT assembly pricing and capability check.
- LP5024 VQFN exposed-pad paste and thermal-pad review.
- RGB LED pinout verification against the final JLC selected part.
- USB-C connector footprint and shell grounding review.

## Current JLC Candidate Parts

| Designator | Part | JLC candidate |
| --- | --- | --- |
| U1 | RP2040 | C2040 |
| U2 | LP5024RSMR | C427525 |
| U3 | W25Q32JVSSIQ | C82344 |
| U4 | AP2112K-3.3TRG1 | C51118 |
| U5 | TPD2EUSB30DRTR | C94934 |
| J1 | TYPE-C-31-M-12 | C165948 |
| D1-D6 | S4-3528RGBTA-A | C2827321 |

## Remaining Order Blockers

- Replace block-level schematic review symbols with a pin-by-pin schematic before fabrication.
- Verify the 4-pin RGB LED pad mapping against the final part datasheet.
- Review USB D+/D- routing, ESD placement, and differential pair geometry.
- Review 4-layer stackup, impedance assumptions, and copper pours against the selected JLC service.
- Export JLC BOM and CPL files in the exact order-site format after final component matching.
- Decide whether the first paid order uses black solder mask plus ENIG or a lower-cost engineering finish.
`;
}

async function writeStaticFiles() {
  await Promise.all([
    writeFile(projectPath, projectFile(), 'utf8'),
    writeFile(schematicPath, schematicFile(), 'utf8'),
    writeFile(symbolLibraryPath, symbolLibraryFile(), 'utf8'),
    writeFile(symLibTablePath, symLibTableFile(), 'utf8'),
    writeFile(readmePath, designReadme(), 'utf8'),
    writeFile(bomPath, bomFile(), 'utf8'),
    writeFile(sourcingPath, sourcingFile(), 'utf8'),
    writeFile(powerCsvPath, csv(powerRows()), 'utf8'),
    writeFile(powerMdPath, powerMarkdown(), 'utf8'),
    writeFile(readinessPath, readinessMarkdown(), 'utf8'),
  ]);
}

function generateBoard() {
  const pythonScript = join(scriptDir, 'generate_rev_a1_board.py');
  const result = spawnSync(kicadPython, [pythonScript, boardPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      KICAD_ROOT: kicadRoot,
    },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`KiCad board generator failed with exit code ${result.status}`);
  }
}

await ensureDirs();
await writeStaticFiles();
generateBoard();

console.log(`Generated Rev A1 KiCad hardware baseline at ${projectDir}`);
