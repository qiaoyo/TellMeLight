import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const kicadRoot = process.env.KICAD_ROOT ?? 'E:\\kicad';
const kicadPython = process.env.KICAD_PYTHON ?? join(kicadRoot, 'bin', 'python.exe');

const sourceDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a1');
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a2');
const footprintDir = join(projectDir, 'tellmelight_rev_a2.pretty');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a2');

const replacements = [
  ['tellmelight_rev_a1', 'tellmelight_rev_a2'],
  ['TellMeLight Rev A1', 'TellMeLight Rev A2'],
  ['Rev A1', 'Rev A2'],
  ['revision": "Rev A1"', 'revision": "Rev A2"'],
  ['filename": "tellmelight_rev_a1.kicad_pro"', 'filename": "tellmelight_rev_a2.kicad_pro"'],
  ['"A1"', '"A2"'],
  ['Package_TO_SOT_SMD:SOT-23-6', 'Package_TO_SOT_SMD:Texas_DRT-3'],
  [
    'LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100',
    'TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm',
  ],
  [
    'This file is the Rev A2 block-level schematic/net plan. Pin-by-pin signoff remains a review item.',
    'Rev A2 pin map is documented in hardware/notes/rev-a2-pin-map.md; RGB LED pinout remains a RED order blocker.',
  ],
];

function applyReplacements(text) {
  return replacements.reduce((current, [from, to]) => current.replaceAll(from, to), text);
}

async function copyTextFile(sourceName, targetName = sourceName) {
  const sourcePath = join(sourceDir, sourceName);
  const targetPath = join(projectDir, targetName);
  const text = await readFile(sourcePath, 'utf8');
  await writeFile(targetPath, applyReplacements(text), 'utf8');
}

function readme() {
  return `# TellMeLight Rev A2 KiCad Project

Generated: 2026-05-30

## Contents

- \`tellmelight_rev_a2.kicad_pro\`: KiCad project.
- \`tellmelight_rev_a2.kicad_sch\`: Rev A2 review schematic/net plan linked to the pin map.
- \`tellmelight_rev_a2.kicad_sym\` and \`sym-lib-table\`: local symbols so KiCad can export a review BOM.
- \`tellmelight_rev_a2.kicad_pcb\`: 4-layer PCB floorplan with the Rev A2 footprint corrections.
- \`tellmelight_rev_a2.pretty/\`: local footprints, currently including the TUOZHAN S4-3528RGBTA-A RGB LED footprint.

## Rev A2 Changes From Rev A1

- U5 USB ESD footprint is corrected from \`SOT-23-6\` to \`Texas_DRT-3\` for \`TPD2EUSB30DRTR\`.
- D1-D6 use a local TUOZHAN S4-3528RGBTA-A footprint because the Rev A1 Wurth PLCC4 pad numbering was opposite the C2827321 datasheet orientation.
- U3 flash sourcing direction uses \`C179173\` as the working alternate while \`C82344\` has stock risk.
- R7/R8 and C15/C16 are added to the board placement for LP5024 IREF, EN, VCAP, and VCC support.
- The order package now has JLC-searchable candidates for the small resistors, capacitors, crystal, and service switches.

## Important Boundary

This remains a Rev A2 review package. Do not order boards until the JLC orientation preview is checked for D1-D6 and all other polarized/oriented parts.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
`;
}

function fpLibTable() {
  return `(fp_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight_Rev_A2")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a2.pretty")
\t\t(options "")
\t\t(descr "TellMeLight Rev A2 local footprints")
\t)
)
`;
}

function ledFootprint() {
  return `(footprint "LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm"
\t(version 20260206)
\t(generator "pcbnew")
\t(generator_version "10.0")
\t(layer "F.Cu")
\t(descr "TUOZHAN S4-3528RGBTA-A, C2827321, 3.5x2.8mm SMD3528-4P common-anode RGB LED, https://datasheet.lcsc.com/datasheet/pdf/341ab1a3675a770275b38577ba3ea83d.pdf")
\t(tags "LED RGB TUOZHAN S4-3528RGBTA-A C2827321 common-anode 3528")
\t(property "Reference" "REF**"
\t\t(at 0 -2.4 0)
\t\t(layer "F.SilkS")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)
\t(property "Value" "LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm"
\t\t(at 0 2.5 0)
\t\t(layer "F.Fab")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)
\t(attr smd)
\t(fp_line
\t\t(start -2.5 -1.2)
\t\t(end -2.1 -1.6)
\t\t(stroke
\t\t\t(width 0.12)
\t\t\t(type default)
\t\t)
\t\t(layer "F.SilkS")
\t)
\t(fp_line
\t\t(start -2.5 1.6)
\t\t(end -2.5 -1.2)
\t\t(stroke
\t\t\t(width 0.12)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.SilkS")
\t)
\t(fp_line
\t\t(start -2.5 1.6)
\t\t(end 2.5 1.6)
\t\t(stroke
\t\t\t(width 0.12)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.SilkS")
\t)
\t(fp_line
\t\t(start -2.1 -1.6)
\t\t(end 2.5 -1.6)
\t\t(stroke
\t\t\t(width 0.12)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.SilkS")
\t)
\t(fp_line
\t\t(start 2.5 1.6)
\t\t(end 2.5 -1.6)
\t\t(stroke
\t\t\t(width 0.12)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.SilkS")
\t)
\t(fp_line
\t\t(start -2.55 -1.65)
\t\t(end -2.55 1.65)
\t\t(stroke
\t\t\t(width 0.05)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.CrtYd")
\t)
\t(fp_line
\t\t(start -2.55 1.65)
\t\t(end 2.55 1.65)
\t\t(stroke
\t\t\t(width 0.05)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.CrtYd")
\t)
\t(fp_line
\t\t(start 2.55 -1.65)
\t\t(end -2.55 -1.65)
\t\t(stroke
\t\t\t(width 0.05)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.CrtYd")
\t)
\t(fp_line
\t\t(start 2.55 1.65)
\t\t(end 2.55 -1.65)
\t\t(stroke
\t\t\t(width 0.05)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.CrtYd")
\t)
\t(fp_line
\t\t(start -1.75 -1.4)
\t\t(end -1.75 1.4)
\t\t(stroke
\t\t\t(width 0.1)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.Fab")
\t)
\t(fp_line
\t\t(start -1.75 1.4)
\t\t(end 1.75 1.4)
\t\t(stroke
\t\t\t(width 0.1)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.Fab")
\t)
\t(fp_line
\t\t(start -0.75 -1.4)
\t\t(end -1.75 -0.4)
\t\t(stroke
\t\t\t(width 0.1)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.Fab")
\t)
\t(fp_line
\t\t(start 1.75 -1.4)
\t\t(end -1.75 -1.4)
\t\t(stroke
\t\t\t(width 0.1)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.Fab")
\t)
\t(fp_line
\t\t(start 1.75 1.4)
\t\t(end 1.75 -1.4)
\t\t(stroke
\t\t\t(width 0.1)
\t\t\t(type solid)
\t\t)
\t\t(layer "F.Fab")
\t)
\t(fp_text user "1"
\t\t(at -3 -0.7 0)
\t\t(layer "F.SilkS")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 0.8 0.8)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)
\t(fp_text user "\${REFERENCE}"
\t\t(at 0 0 0)
\t\t(layer "F.Fab")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 0.5 0.5)
\t\t\t\t(thickness 0.075)
\t\t\t)
\t\t)
\t)
\t(pad "1" smd rect
\t\t(at -1.55 -0.7)
\t\t(size 1.5 0.9)
\t\t(layers "F.Cu" "F.Mask" "F.Paste")
\t)
\t(pad "2" smd rect
\t\t(at -1.55 0.7)
\t\t(size 1.5 0.9)
\t\t(layers "F.Cu" "F.Mask" "F.Paste")
\t)
\t(pad "3" smd rect
\t\t(at 1.55 -0.7)
\t\t(size 1.5 0.9)
\t\t(layers "F.Cu" "F.Mask" "F.Paste")
\t)
\t(pad "4" smd rect
\t\t(at 1.55 0.7)
\t\t(size 1.5 0.9)
\t\t(layers "F.Cu" "F.Mask" "F.Paste")
\t)
\t(embedded_fonts no)
\t(model "\${KICAD10_3DMODEL_DIR}/LED_SMD.3dshapes/LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100.step"
\t\t(offset
\t\t\t(xyz 0 0 0)
\t\t)
\t\t(scale
\t\t\t(xyz 1 1 1)
\t\t)
\t\t(rotate
\t\t\t(xyz 0 0 0)
\t\t)
\t)
)
`;
}

async function writeProjectFiles() {
  await Promise.all([
    mkdir(projectDir, { recursive: true }),
    mkdir(footprintDir, { recursive: true }),
    mkdir(outputsDir, { recursive: true }),
  ]);

  await copyTextFile('tellmelight_rev_a1.kicad_pro', 'tellmelight_rev_a2.kicad_pro');
  await copyTextFile('tellmelight_rev_a1.kicad_sch', 'tellmelight_rev_a2.kicad_sch');
  await copyTextFile('tellmelight_rev_a1.kicad_sym', 'tellmelight_rev_a2.kicad_sym');
  await copyTextFile('sym-lib-table');
  await writeFile(join(projectDir, 'fp-lib-table'), fpLibTable(), 'utf8');
  await writeFile(join(footprintDir, 'LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm.kicad_mod'), ledFootprint(), 'utf8');
  await writeFile(join(projectDir, 'README.md'), readme(), 'utf8');
}

function generateBoard() {
  const pythonScript = join(scriptDir, 'generate_rev_a2_board.py');
  const boardPath = join(projectDir, 'tellmelight_rev_a2.kicad_pcb');
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

await writeProjectFiles();
generateBoard();

console.log(`Generated Rev A2 KiCad hardware baseline at ${projectDir}`);
