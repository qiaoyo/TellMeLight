import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const repoRoot = process.cwd();
const netlistDir = join(repoRoot, 'hardware', 'netlists');
const notesDir = join(repoRoot, 'hardware', 'notes');

function pin(pinNumber, name, net, status = 'GREEN', notes = '') {
  return { pin: pinNumber, name, net, status, notes };
}

function component(ref, value, symbol, footprint, pins, notes = '') {
  return { ref, value, symbol, footprint, pins, notes };
}

function led(ref, slot, red, green, blue) {
  return component(
    ref,
    'S4-3528RGBTA-A',
    'TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A',
    'TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm',
    [
      pin('1', 'Blue cathode', blue, 'GREEN', `Slot ${slot} blue sink to LP5024.`),
      pin('2', 'Common anode', 'VLED', 'GREEN', `Slot ${slot} common anode rail.`),
      pin('3', 'Green cathode', green, 'GREEN', `Slot ${slot} green sink to LP5024.`),
      pin('4', 'Red cathode', red, 'GREEN', `Slot ${slot} red sink to LP5024.`),
    ],
    `FIFO session slot ${slot}; TUOZHAN datasheet pinout resolved in Rev A2.`,
  );
}

function resistor(ref, value, netA, netB, notes = '') {
  return component(ref, value, 'Device:R', 'Resistor_SMD:R_0603_1608Metric', [
    pin('1', 'A', netA),
    pin('2', 'B', netB),
  ], notes);
}

function capacitor(ref, value, netA, netB, status = 'GREEN', notes = '') {
  return component(ref, value, 'Device:C', 'Capacitor_SMD:C_0603_1608Metric', [
    pin('1', 'A', netA, status),
    pin('2', 'B', netB, status),
  ], notes);
}

function testPoint(ref, value, net) {
  return component(ref, value, 'Connector:TestPoint', 'TestPoint:TestPoint_Pad_D1.0mm', [
    pin('1', 'pad', net, 'GREEN', 'Bring-up pogo/test pad.'),
  ]);
}

const components = [
  component(
    'U1',
    'RP2040',
    'MCU_RaspberryPi:RP2040',
    'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias',
    [
      pin('2', 'GPIO0', 'GPIO0_RESERVED', 'GREEN', 'Reserved for debug or future feature.'),
      pin('3', 'GPIO1', 'GPIO1_RESERVED_LP_EN_OPTION', 'YELLOW', 'Optional future firmware EN control; Rev A3 keeps LP5024 always enabled.'),
      pin('6', 'GPIO4/I2C0_SDA', 'I2C0_SDA'),
      pin('7', 'GPIO5/I2C0_SCL', 'I2C0_SCL'),
      pin('20', 'XIN', 'XIN', 'YELLOW', 'Crystal/load-cap value remains under review.'),
      pin('21', 'XOUT', 'XOUT', 'YELLOW', 'Crystal/load-cap value remains under review.'),
      pin('24', 'SWCLK', 'SWCLK'),
      pin('25', 'SWDIO', 'SWDIO'),
      pin('26', 'RUN', 'RUN_RESET'),
      pin('46', 'USB_DM', 'USB_DM_MCU'),
      pin('47', 'USB_DP', 'USB_DP_MCU'),
      pin('51', 'QSPI_SD3', 'FLASH_HOLD_IO3'),
      pin('52', 'QSPI_SCLK', 'FLASH_SCLK'),
      pin('53', 'QSPI_SD0', 'FLASH_IO0_MOSI'),
      pin('54', 'QSPI_SD2', 'FLASH_WP_IO2'),
      pin('55', 'QSPI_SD1', 'FLASH_IO1_MISO'),
      pin('56', 'QSPI_CSn', 'FLASH_CS_N_BOOTSEL'),
      pin('1', 'IOVDD', '3V3'),
      pin('10', 'IOVDD', '3V3'),
      pin('22', 'IOVDD', '3V3'),
      pin('33', 'IOVDD', '3V3'),
      pin('42', 'IOVDD', '3V3'),
      pin('49', 'IOVDD', '3V3'),
      pin('23', 'DVDD', '3V3', 'YELLOW', 'Final RP2040 decoupling grouping still needs schematic review.'),
      pin('50', 'DVDD', '3V3', 'YELLOW', 'Final RP2040 decoupling grouping still needs schematic review.'),
      pin('44', 'VREG_VIN', '3V3', 'YELLOW', 'Confirm against RP2040 reference schematic during final signoff.'),
      pin('45', 'VREG_VOUT', 'RP2040_VREG_OUT', 'YELLOW', 'Confirm required capacitor placement/value during final signoff.'),
      pin('48', 'USB_VDD', '3V3_USB'),
      pin('19', 'TESTEN', 'GND'),
      pin('57', 'EP/GND', 'GND'),
    ],
    'Main MCU, USB device endpoint, QSPI boot flash host, and I2C LED-driver controller.',
  ),
  component(
    'U2',
    'LP5024RSMR',
    'TellMeLight_Rev_A3:LP5024RSMR',
    'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias',
    [
      ...Array.from({ length: 18 }, (_, index) => {
        const slot = Math.floor(index / 3) + 1;
        const color = ['R', 'G', 'B'][index % 3];
        return pin(String(index + 1), `OUT${index}`, `D${slot}_${color}`);
      }),
      pin('19', 'OUT18', 'NC_LP_OUT18_RESERVE'),
      pin('20', 'OUT19', 'NC_LP_OUT19_RESERVE'),
      pin('21', 'OUT20', 'NC_LP_OUT20_RESERVE'),
      pin('22', 'OUT21', 'NC_LP_OUT21_RESERVE'),
      pin('23', 'OUT22', 'NC_LP_OUT22_RESERVE'),
      pin('24', 'OUT23', 'NC_LP_OUT23_RESERVE'),
      pin('25', 'ADDR0', 'GND'),
      pin('26', 'ADDR1', 'GND'),
      pin('27', 'VCC', '3V3'),
      pin('28', 'SDA', 'I2C0_SDA'),
      pin('29', 'SCL', 'I2C0_SCL'),
      pin('30', 'EN', 'LP_EN'),
      pin('31', 'IREF', 'LP_IREF'),
      pin('32', 'VCAP', 'LP_VCAP'),
      pin('EP', 'Exposed pad', 'GND'),
    ],
    '24-channel current-sink RGB LED driver; local schematic symbol required because KiCad stock library does not include LP5024.',
  ),
  led('D1', 1, 'D1_R', 'D1_G', 'D1_B'),
  led('D2', 2, 'D2_R', 'D2_G', 'D2_B'),
  led('D3', 3, 'D3_R', 'D3_G', 'D3_B'),
  led('D4', 4, 'D4_R', 'D4_G', 'D4_B'),
  led('D5', 5, 'D5_R', 'D5_G', 'D5_B'),
  led('D6', 6, 'D6_R', 'D6_G', 'D6_B'),
  component('U3', 'W25Q32JVSSIQ', 'Memory_Flash:W25Q32JVSS', 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm', [
    pin('1', '/CS', 'FLASH_CS_N_BOOTSEL'),
    pin('2', 'DO/IO1', 'FLASH_IO1_MISO'),
    pin('3', '/WP/IO2', 'FLASH_WP_IO2'),
    pin('4', 'GND', 'GND'),
    pin('5', 'DI/IO0', 'FLASH_IO0_MOSI'),
    pin('6', 'CLK', 'FLASH_SCLK'),
    pin('7', '/HOLD/IO3', 'FLASH_HOLD_IO3'),
    pin('8', 'VCC', '3V3'),
  ]),
  component('U4', 'AP2112K-3.3', 'Regulator_Linear:AP2112K-3.3', 'Package_TO_SOT_SMD:SOT-23-5', [
    pin('1', 'VIN', 'VBUS'),
    pin('2', 'GND', 'GND'),
    pin('3', 'EN', 'VBUS', 'GREEN', 'Always enabled when USB VBUS is present.'),
    pin('4', 'NC', 'NC_U4_4'),
    pin('5', 'VOUT', '3V3'),
  ]),
  component('U5', 'TPD2EUSB30DRTR', 'Power_Protection:TPD2EUSB30', 'Package_TO_SOT_SMD:Texas_DRT-3', [
    pin('1', 'D+', 'USB_DP_CONN'),
    pin('2', 'D-', 'USB_DM_CONN'),
    pin('3', 'GND', 'GND'),
  ]),
  component('J1', 'USB_C_Receptacle_USB2.0_16P', 'Connector:USB_C_Receptacle_USB2.0_16P', 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12', [
    pin('A4/B4/A9/B9', 'VBUS', 'VBUS'),
    pin('A1/B1/A12/B12', 'GND', 'GND'),
    pin('A6/B6', 'D+', 'USB_DP_CONN'),
    pin('A7/B7', 'D-', 'USB_DM_CONN'),
    pin('A5', 'CC1', 'CC1'),
    pin('B5', 'CC2', 'CC2'),
    pin('A8/B8', 'SBU', 'NC_SBU'),
    pin('S1/S2/S3/S4', 'Shield', 'SHIELD', 'YELLOW', 'Final shell-grounding strategy depends on enclosure and ESD review.'),
  ]),
  component('Y1', '12MHz C9002', 'Device:Crystal', 'Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm', [
    pin('1', 'X1', 'XIN', 'YELLOW'),
    pin('2', 'GND', 'GND', 'YELLOW'),
    pin('3', 'X2', 'XOUT', 'YELLOW'),
    pin('4', 'GND', 'GND', 'YELLOW'),
  ], 'Crystal load and ESR review remains a Rev A3 signoff item.'),
  component('SW1', 'BOOTSEL EVQP2R02M', 'Switch:SW_Push', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', [
    pin('1', 'A', 'FLASH_CS_N_BOOTSEL'),
    pin('2', 'B', 'GND'),
  ]),
  component('SW2', 'RESET EVQP2R02M', 'Switch:SW_Push', 'Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm', [
    pin('1', 'A', 'RUN_RESET'),
    pin('2', 'B', 'GND'),
  ]),
  resistor('R1', '27R', 'USB_DP_CONN', 'USB_DP_MCU', 'USB D+ series termination.'),
  resistor('R2', '27R', 'USB_DM_CONN', 'USB_DM_MCU', 'USB D- series termination.'),
  resistor('R3', '5.1k', 'CC1', 'GND', 'USB-C sink Rd pulldown.'),
  resistor('R4', '5.1k', 'CC2', 'GND', 'USB-C sink Rd pulldown.'),
  resistor('R5', '4.7k', '3V3', 'I2C0_SDA', 'I2C SDA pull-up.'),
  resistor('R6', '4.7k', '3V3', 'I2C0_SCL', 'I2C SCL pull-up.'),
  resistor('R7', '10k', 'LP_IREF', 'GND', 'LP5024 full-scale current reference.'),
  resistor('R8', '10k', '3V3', 'LP_EN', 'LP5024 always-on pull-up.'),
  capacitor('C1', '100nF', '3V3', 'GND', 'YELLOW', 'RP2040 local decoupling group.'),
  capacitor('C2', '100nF', '3V3', 'GND', 'YELLOW', 'RP2040 local decoupling group.'),
  capacitor('C3', '100nF', '3V3', 'GND', 'YELLOW', 'LP5024 local decoupling group.'),
  capacitor('C4', '100nF', '3V3', 'GND', 'YELLOW', 'LP5024 local decoupling group.'),
  capacitor('C5', '100nF', '3V3', 'GND', 'YELLOW', 'Flash local decoupling.'),
  capacitor('C6', '100nF', '3V3', 'GND', 'YELLOW', 'Regulator output local decoupling.'),
  capacitor('C7', '100nF', '3V3_USB', 'GND', 'YELLOW', 'USB PHY supply decoupling candidate; placement/value review remains before schematic signoff.'),
  capacitor('C8', '100nF', 'VBUS', 'GND', 'YELLOW', 'USB VBUS local high-frequency decoupling.'),
  capacitor('C9', '100nF', '3V3', 'GND', 'YELLOW', 'Additional local decoupling.'),
  capacitor('C10', '100nF', '3V3', 'GND', 'YELLOW', 'Additional local decoupling.'),
  capacitor('C11', '10uF', 'VBUS', 'GND', 'YELLOW', 'AP2112 input bulk capacitor.'),
  capacitor('C12', '10uF', '3V3', 'GND', 'YELLOW', 'AP2112 output bulk capacitor.'),
  capacitor('C13', '33pF', 'XIN', 'GND', 'YELLOW', 'Crystal load cap candidate; recalculate before order.'),
  capacitor('C14', '33pF', 'XOUT', 'GND', 'YELLOW', 'Crystal load cap candidate; recalculate before order.'),
  capacitor('C15', '1uF', 'LP_VCAP', 'GND'),
  capacitor('C16', '1uF', '3V3', 'GND', 'GREEN', 'LP5024 VCC local capacitor.'),
  testPoint('TP1', 'VBUS', 'VBUS'),
  testPoint('TP2', '3V3', '3V3'),
  testPoint('TP3', 'GND', 'GND'),
  testPoint('TP4', 'SDA', 'I2C0_SDA'),
  testPoint('TP5', 'SCL', 'I2C0_SCL'),
  testPoint('TP6', 'D+', 'USB_DP_CONN'),
  testPoint('TP7', 'D-', 'USB_DM_CONN'),
  testPoint('TP8', 'RUN', 'RUN_RESET'),
  testPoint('TP9', 'SWDIO', 'SWDIO'),
  testPoint('TP10', 'SWCLK', 'SWCLK'),
  testPoint('TP11', 'RUN', 'RUN_RESET'),
  testPoint('TP12', '3V3', '3V3'),
  testPoint('TP13', 'GND', 'GND'),
];

function buildNets() {
  const pinsByNet = new Map();

  for (const item of components) {
    for (const itemPin of item.pins) {
      if (!pinsByNet.has(itemPin.net)) {
        pinsByNet.set(itemPin.net, []);
      }
      pinsByNet.get(itemPin.net).push(`${item.ref}.${itemPin.pin}`);
    }
  }

  return [...pinsByNet.entries()]
    .map(([name, pins]) => ({ name, pins: pins.sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const symbolReadiness = [
  {
    item: 'RP2040',
    symbol: 'MCU_RaspberryPi:RP2040',
    footprint: 'Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias',
    status: 'STOCK_SYMBOL_OK',
  },
  {
    item: 'W25Q32JVSSIQ',
    symbol: 'Memory_Flash:W25Q32JVSS',
    footprint: 'Package_SO:SOIC-8_3.9x4.9mm_P1.27mm',
    status: 'STOCK_SYMBOL_OK',
  },
  {
    item: 'AP2112K-3.3',
    symbol: 'Regulator_Linear:AP2112K-3.3',
    footprint: 'Package_TO_SOT_SMD:SOT-23-5',
    status: 'STOCK_SYMBOL_OK',
  },
  {
    item: 'TPD2EUSB30DRTR',
    symbol: 'Power_Protection:TPD2EUSB30',
    footprint: 'Package_TO_SOT_SMD:Texas_DRT-3',
    status: 'STOCK_SYMBOL_OK',
  },
  {
    item: 'USB-C TYPE-C-31-M-12',
    symbol: 'Connector:USB_C_Receptacle_USB2.0_16P',
    footprint: 'Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12',
    status: 'STOCK_SYMBOL_OK_PIN_MAPPING_REVIEW_REQUIRED',
  },
  {
    item: 'LP5024RSMR',
    symbol: 'TellMeLight_Rev_A3:LP5024RSMR',
    footprint: 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias',
    status: 'LOCAL_SYMBOL_REQUIRED',
  },
  {
    item: 'S4-3528RGBTA-A',
    symbol: 'TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A',
    footprint: 'TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm',
    status: 'LOCAL_SYMBOL_REQUIRED',
  },
];

const netlist = {
  metadata: {
    project: 'TellMeLight',
    revision: 'A3',
    generated: '2026-05-30',
    status: 'PIN_LEVEL_NETLIST_READY_FOR_SCHEMATIC_DRAFT',
    sourceRevision: 'Rev A2 pin map, sourcing notes, and local KiCad 10 library probe',
  },
  symbolReadiness,
  components,
  nets: buildNets(),
};

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function csv() {
  const rows = [['Reference', 'Value', 'Pin', 'Pin Name', 'Net', 'Status', 'Notes']];
  for (const item of components) {
    for (const itemPin of item.pins) {
      rows.push([
        item.ref,
        item.value,
        itemPin.pin,
        itemPin.name,
        itemPin.net,
        itemPin.status,
        itemPin.notes,
      ]);
    }
  }
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function feasibilityNote() {
  return `# Rev A3 Pin-Level Schematic Feasibility

Date: 2026-05-30

Rev A3 starts the transition from the Rev A2 block-level schematic/net plan toward a real pin-level KiCad schematic. This checkpoint creates a machine-readable pin netlist first, because it is easier to review and test before generating KiCad schematic geometry.

Rev A2 remains NOT_FOR_ORDER. The current Rev A2 Gerbers/BOM/CPL can be used for quote-upload practice, but not for payment or fabrication release.

## Generated Assets

- \`hardware/netlists/rev_a3_pin_netlist.json\`: structured component, pin, net, symbol-readiness, and status data.
- \`hardware/netlists/rev_a3_pin_netlist.csv\`: spreadsheet-friendly pin table for review.
- \`hardware/notes/rev-a3-pin-level-schematic-feasibility.md\`: this feasibility and next-step note.

## Stock KiCad Symbols Available

- \`MCU_RaspberryPi:RP2040\` for U1.
- \`Memory_Flash:W25Q32JVSS\` for U3.
- \`Regulator_Linear:AP2112K-3.3\` for U4.
- \`Power_Protection:TPD2EUSB30\` for U5.
- \`Connector:USB_C_Receptacle_USB2.0_16P\` for J1, with HRO footprint pin mapping still requiring review.

## Stock KiCad Footprints Available

- \`Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias\` for RP2040.
- \`Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias\` for LP5024.
- \`Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12\` for USB-C.
- \`Package_TO_SOT_SMD:Texas_DRT-3\` for TPD2EUSB30DRTR.
- \`Package_SO:SOIC-8_3.9x4.9mm_P1.27mm\` for W25Q32JVSSIQ.
- \`Package_TO_SOT_SMD:SOT-23-5\` for AP2112K-3.3.
- \`Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm\` for the C9002 12MHz crystal candidate.
- \`Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm\` for BOOTSEL and RESET.

## Local Symbols Required

- \`TellMeLight_Rev_A3:LP5024RSMR\`: KiCad 10 stock symbols do not include LP5024; Rev A3 must create a local 32-pin + exposed-pad symbol and verify the TI pin order.
- \`TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A\`: the generic \`Device:LED_RGB\` symbol does not encode the TUOZHAN S4-3528RGBTA-A common-anode pin mapping. Rev A3 should use a local symbol that matches C2827321 exactly.

## Electrical Review Notes

- LP5024 OUT0..OUT17 are mapped to D1..D6 RGB cathodes. OUT18..OUT23 remain reserved.
- Every RGB LED pad 2 connects to \`VLED\`; LP5024 sinks current on the color cathodes.
- USB D+/D- route through R1/R2 27R series resistors, with U5 on the connector side.
- BOOTSEL pulls \`FLASH_CS_N_BOOTSEL\` low; RESET pulls \`RUN_RESET\` low.
- C13/C14 33pF and Y1 C9002 remain YELLOW because the final crystal load-capacitance math still needs signoff.
- The USB-C shell \`SHIELD\` net remains YELLOW until the enclosure/ESD strategy is selected.

## Next Local Step

Generate a Rev A3 KiCad pin-level schematic draft from this netlist with local LP5024 and LED symbols, then run KiCad ERC. The draft should stay clearly marked as not order-ready until ERC, DRC, net parity, JLC orientation preview, USB shell grounding, and crystal review are complete.
`;
}

await Promise.all([
  mkdir(netlistDir, { recursive: true }),
  mkdir(notesDir, { recursive: true }),
]);

await writeFile(join(netlistDir, 'rev_a3_pin_netlist.json'), `${JSON.stringify(netlist, null, 2)}\n`, 'utf8');
await writeFile(join(netlistDir, 'rev_a3_pin_netlist.csv'), csv(), 'utf8');
await writeFile(join(notesDir, 'rev-a3-pin-level-schematic-feasibility.md'), feasibilityNote(), 'utf8');

console.log(`Generated Rev A3 pin-level netlist at ${netlistDir}`);
