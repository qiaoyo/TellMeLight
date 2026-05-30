import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const kicadRoot = process.env.KICAD_ROOT ?? 'E:\\kicad';
const kicadCli = process.env.KICAD_CLI ?? join(kicadRoot, 'bin', 'kicad-cli.exe');
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a3');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a3');
const notesDir = join(repoRoot, 'hardware', 'notes');
const symbolPath = join(projectDir, 'tellmelight_rev_a3.kicad_sym');
const upgradeCheckPath = join(outputsDir, 'tellmelight_rev_a3_symbol_upgrade_check.kicad_sym');

function effects(size = '1.27 1.27') {
  return `\t\t\t\t(effects
\t\t\t\t\t(font
\t\t\t\t\t\t(size ${size})
\t\t\t\t\t)
\t\t\t\t)
`;
}

function property(name, value, x, y, hidden = false) {
  return `\t\t(property "${name}" "${value}"
\t\t\t(at ${x} ${y} 0)
\t\t\t${hidden ? '(hide yes)' : '(show_name no)'}
${effects()}\t\t)
`;
}

function pinBlock(type, number, name, x, y, rotation, length = 5.08) {
  return `\t\t\t(pin ${type} line
\t\t\t\t(at ${x} ${y} ${rotation})
\t\t\t\t(length ${length})
\t\t\t\t(name "${name}"
${effects()}\t\t\t\t)
\t\t\t\t(number "${number}"
${effects()}\t\t\t\t)
\t\t\t)
`;
}

function lp5024Pins() {
  const pins = [];
  for (let i = 0; i <= 17; i += 1) {
    pins.push(pinBlock('output', String(i + 1), `OUT${i}`, -20.32, 17.78 - i * 2.54, 0));
  }
  for (let i = 18; i <= 23; i += 1) {
    pins.push(pinBlock('no_connect', String(i + 1), `OUT${i}`, -20.32, 17.78 - i * 2.54, 0));
  }

  const rightPins = [
    ['25', 'ADDR0', 'passive'],
    ['26', 'ADDR1', 'passive'],
    ['27', 'VCC', 'power_in'],
    ['28', 'SDA', 'bidirectional'],
    ['29', 'SCL', 'input'],
    ['30', 'EN', 'input'],
    ['31', 'IREF', 'passive'],
    ['32', 'VCAP', 'passive'],
  ];
  for (let i = 0; i < rightPins.length; i += 1) {
    const [number, name, type] = rightPins[i];
    pins.push(pinBlock(type, number, name, 20.32, 8.89 - i * 2.54, 180));
  }

  pins.push(pinBlock('power_in', 'EP', 'GND_EP', 0, -22.86, 90));
  return pins.join('');
}

function lp5024Symbol() {
  return `\t(symbol "LP5024RSMR"
\t\t(pin_names
\t\t\t(offset 0.508)
\t\t)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
\t\t(in_pos_files yes)
\t\t(duplicate_pin_numbers_are_jumpers no)
${property('Reference', 'U', -10.16, 25.4)}
${property('Value', 'LP5024RSMR', -2.54, 25.4)}
${property('Footprint', 'Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 0, 0, true)}
${property('Datasheet', 'https://www.ti.com/lit/ds/symlink/lp5024.pdf', 0, 0, true)}
${property('Description', '24-channel RGB LED driver, 32-pin VQFN with exposed pad', 0, 0, true)}
\t\t(symbol "LP5024RSMR_0_1"
\t\t\t(rectangle
\t\t\t\t(start -15.24 22.86)
\t\t\t\t(end 15.24 -20.32)
\t\t\t\t(stroke
\t\t\t\t\t(width 0.254)
\t\t\t\t\t(type default)
\t\t\t\t)
\t\t\t\t(fill
\t\t\t\t\t(type background)
\t\t\t\t)
\t\t\t)
\t\t)
\t\t(symbol "LP5024RSMR_1_1"
${lp5024Pins()}\t\t)
\t\t(embedded_fonts no)
\t)
`;
}

function ledSymbol() {
  return `\t(symbol "LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A"
\t\t(pin_names
\t\t\t(offset 0.508)
\t\t)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
\t\t(in_pos_files yes)
\t\t(duplicate_pin_numbers_are_jumpers no)
${property('Reference', 'D', -5.08, 8.89)}
${property('Value', 'S4-3528RGBTA-A', -5.08, -8.89)}
${property('Footprint', 'TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm', 0, 0, true)}
${property('Datasheet', 'https://datasheet.lcsc.com/datasheet/pdf/341ab1a3675a770275b38577ba3ea83d.pdf', 0, 0, true)}
${property('Description', 'C2827321 TUOZHAN common-anode RGB LED, pad 1 blue cathode, pad 2 common anode, pad 3 green cathode, pad 4 red cathode', 0, 0, true)}
\t\t(symbol "LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A_0_1"
\t\t\t(rectangle
\t\t\t\t(start -5.08 6.35)
\t\t\t\t(end 5.08 -6.35)
\t\t\t\t(stroke
\t\t\t\t\t(width 0.254)
\t\t\t\t\t(type default)
\t\t\t\t)
\t\t\t\t(fill
\t\t\t\t\t(type background)
\t\t\t\t)
\t\t\t)
\t\t\t(text "CA"
\t\t\t\t(at 2.54 0 0)
${effects('1.0 1.0')}\t\t\t)
\t\t)
\t\t(symbol "LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A_1_1"
${pinBlock('passive', '1', 'Blue cathode', -10.16, -2.54, 0)}
${pinBlock('passive', '2', 'Common anode', 10.16, 0, 180)}
${pinBlock('passive', '3', 'Green cathode', -10.16, 0, 0)}
${pinBlock('passive', '4', 'Red cathode', -10.16, 2.54, 0)}\t\t)
\t\t(embedded_fonts no)
\t)
`;
}

function symbolLibrary() {
  return `(kicad_symbol_lib
\t(version 20241209)
\t(generator "tellmelight_rev_a3_symbol_generator")
\t(generator_version "1")
${lp5024Symbol()}${ledSymbol()})
`;
}

function symLibTable() {
  return `(sym_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight_Rev_A3")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a3.kicad_sym")
\t\t(options "")
\t\t(descr "TellMeLight Rev A3 local symbols")
\t)
)
`;
}

function readme() {
  return `# TellMeLight Rev A3 local symbols

Generated: 2026-05-30

This directory currently contains the local symbol library needed before creating the Rev A3 pin-level schematic draft.

## Symbols

- \`LP5024RSMR\`: 32-pin VQFN LED driver plus exposed pad \`GND_EP\`.
- \`LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A\`: exact C2827321 / S4-3528RGBTA-A common-anode LED pin mapping.

## Boundary

These symbols are ready for the schematic draft, but they are not fabrication signoff by themselves. Rev A2 remains \`NOT_FOR_ORDER\` until JLC orientation preview, USB-C shell grounding, crystal review, and full schematic/PCB review are complete.
`;
}

function review() {
  return `# Rev A3 Symbol Library Review

Date: 2026-05-30

Status: LOCAL_SYMBOL_READY_FOR_SCHEMATIC_DRAFT

Rev A2 remains NOT_FOR_ORDER. This Rev A3 checkpoint only removes the missing-symbol blocker for a later pin-level schematic draft.

## Local Symbols

- LP5024RSMR: local KiCad symbol with OUT0..OUT23, ADDR0, ADDR1, VCC, SDA, SCL, EN, IREF, VCAP, and GND_EP.
- S4-3528RGBTA-A: local KiCad symbol for C2827321 with pad 1 blue cathode, pad 2 common anode, pad 3 green cathode, and pad 4 red cathode.

## Validation

- KiCad symbol library syntax is checked by \`kicad-cli sym upgrade\`.
- The upgraded check copy is written to \`hardware/outputs/rev_a3/tellmelight_rev_a3_symbol_upgrade_check.kicad_sym\`.

## Remaining Boundaries

- TI LP5024 pin order still needs visual schematic review against the datasheet during Rev A3.
- The JLC SMT orientation preview remains mandatory before payment.
- This symbol checkpoint does not create final routing, final ERC/DRC signoff, or fabrication approval.
`;
}

await Promise.all([
  mkdir(projectDir, { recursive: true }),
  mkdir(outputsDir, { recursive: true }),
  mkdir(notesDir, { recursive: true }),
]);

await writeFile(symbolPath, symbolLibrary(), 'utf8');
await writeFile(join(projectDir, 'sym-lib-table'), symLibTable(), 'utf8');
await writeFile(join(projectDir, 'README.md'), readme(), 'utf8');
await writeFile(join(notesDir, 'rev-a3-symbol-library-review.md'), review(), 'utf8');
await rm(upgradeCheckPath, { force: true });

const upgradeArgs = ['sym', 'upgrade', '--force', '--output', upgradeCheckPath, symbolPath];
const result = spawnSync(kicadCli, upgradeArgs, {
  cwd: repoRoot,
  encoding: 'utf8',
});
const log = [
  `Command: ${kicadCli} ${upgradeArgs.join(' ')}`,
  `kicad-cli sym upgrade exit code ${result.status}`,
  '--- stdout ---',
  result.stdout || '',
  '--- stderr ---',
  result.stderr || '',
].join('\n');
await writeFile(join(outputsDir, 'symbol-upgrade-check.log'), `${log}\n`, 'utf8');

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`KiCad symbol upgrade check failed with exit code ${result.status}`);
}

console.log(`Generated Rev A3 local symbol library at ${symbolPath}`);
