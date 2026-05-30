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

## Rev A2 Changes From Rev A1

- U5 USB ESD footprint is corrected from \`SOT-23-6\` to \`Texas_DRT-3\` for \`TPD2EUSB30DRTR\`.
- U3 flash sourcing direction uses \`C179173\` as the working alternate while \`C82344\` has stock risk.
- R7/R8 and C15/C16 are added to the board placement for LP5024 IREF, EN, VCAP, and VCC support.
- The order package now has JLC-searchable candidates for the small resistors, capacitors, crystal, and service switches.

## Important Boundary

This remains a Rev A2 review package. Do not order boards until the RGB LED pinout/footprint mapping and JLC orientation preview are checked.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
`;
}

async function writeProjectFiles() {
  await Promise.all([
    mkdir(projectDir, { recursive: true }),
    mkdir(outputsDir, { recursive: true }),
  ]);

  await copyTextFile('tellmelight_rev_a1.kicad_pro', 'tellmelight_rev_a2.kicad_pro');
  await copyTextFile('tellmelight_rev_a1.kicad_sch', 'tellmelight_rev_a2.kicad_sch');
  await copyTextFile('tellmelight_rev_a1.kicad_sym', 'tellmelight_rev_a2.kicad_sym');
  await copyTextFile('sym-lib-table');
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
