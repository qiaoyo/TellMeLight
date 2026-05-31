import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const kicadRoot = process.env.KICAD_ROOT ?? 'E:\\kicad';
const kicadPython = process.env.KICAD_PYTHON ?? join(kicadRoot, 'bin', 'python.exe');

const sourceDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a2');
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a4');
const footprintDir = join(projectDir, 'tellmelight_rev_a4.pretty');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a4');

function fpLibTable() {
  return `(fp_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight_Rev_A4")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a4.pretty")
\t\t(options "")
\t\t(descr "TellMeLight Rev A4 local footprints")
\t)
)
`;
}

function symLibTable() {
  return `(sym_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a4_review.kicad_sym")
\t\t(options "")
\t\t(descr "TellMeLight Rev A4 generic review symbols")
\t)
\t(lib
\t\t(name "TellMeLight_Rev_A4")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a4.kicad_sym")
\t\t(options "")
\t\t(descr "TellMeLight Rev A4 local symbols")
\t)
)
`;
}

function readme() {
  return `# TellMeLight Rev A4 KiCad Project

Generated: 2026-05-31

## Contents

- \`tellmelight_rev_a4.kicad_pro\`: KiCad project.
- \`tellmelight_rev_a4.kicad_sch\`: Rev A4 review schematic/net plan inherited from Rev A2 and marked for A4.
- \`tellmelight_rev_a4.kicad_sym\`: TellMeLight Rev A4 local symbols for LP5024 and the TUOZHAN RGB LED, created in the Rev A4 symbol checkpoint.
- \`tellmelight_rev_a4_review.kicad_sym\`: Rev A4 generic review symbols for the inherited block-level schematic.
- \`tellmelight_rev_a4.kicad_pcb\`: 76 mm x 56 mm 4-layer routing candidate.
- \`tellmelight_rev_a4.pretty/\`: local TUOZHAN RGB LED footprint.

## Rev A4 Changes From Rev A2

- Board outline is reduced from 96 mm x 74 mm to 76 mm x 56 mm.
- U6 \`TPD1E05U06DPY\` adds VLED-to-GND TVS/ESD protection.
- R10 \`0R\` explicitly ties VBUS to VLED.
- R9 \`1M\` and C17 \`10nF\` implement the USB-C shell-to-GND RC network.
- C18 \`1uF\` adds the required RP2040 VREG_VOUT local capacitor.
- Top silkscreen includes a small A1-style separated avatar watermark in an empty optical-face area.
- Top silkscreen title includes the persistent \`By Joey.qiao\` attribution.
- The JLC package is a preview candidate; payment is blocked until JLC DFM and orientation preview are checked.

## Important Boundary

Rev A4 is a compact routing candidate and JLC preview package for board size, SMT matching, placement, orientation, and silkscreen review. It uses the JLC free ordinary via target: 0.45 mm outer / 0.30 mm drill. It is not a paid-order release until JLC DFM accepts the process and the user checks the SMT orientation preview.

## Visual Mapping

- D1 and D2: left long bar, oldest side.
- D3: left middle short bar.
- D4: right middle short bar.
- D5 and D6: right long bar, newest side.
- The A1-style separated avatar watermark sits near the upper top-side empty area and avoids SMT pads.
`;
}

function applyProjectReplacements(text) {
  return text
    .replaceAll('tellmelight_rev_a2', 'tellmelight_rev_a4')
    .replaceAll('TellMeLight Rev A2', 'TellMeLight Rev A4')
    .replaceAll('TellMeLight_Rev_A2', 'TellMeLight_Rev_A4')
    .replaceAll('QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias', 'QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm')
    .replaceAll('VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias', 'VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm')
    .replaceAll('Rev A2', 'Rev A4')
    .replaceAll('"A2"', '"A4"');
}

function applyManufacturingConstraints(text) {
  const project = JSON.parse(text);
  const rules = project.board?.design_settings?.rules;
  if (rules) {
    rules.min_clearance = 0.1;
    rules.min_hole_clearance = 0.08;
    rules.min_through_hole_diameter = 0.3;
    rules.min_track_width = 0.1;
    rules.min_via_annular_width = 0.05;
    rules.min_via_diameter = 0.45;
  }

  const defaultClass = project.net_settings?.classes?.find((item) => item.name === 'Default');
  if (defaultClass) {
    defaultClass.clearance = 0.1;
    defaultClass.track_width = 0.1;
    defaultClass.via_diameter = 0.45;
    defaultClass.via_drill = 0.3;
  }

  return `${JSON.stringify(project, null, 2)}\n`;
}

async function copyProjectText(sourceName, targetName = sourceName) {
  const sourcePath = join(sourceDir, sourceName);
  const targetPath = join(projectDir, targetName);
  const text = await readFile(sourcePath, 'utf8');
  let targetText = applyProjectReplacements(text);
  if (targetName.endsWith('.kicad_pro')) {
    targetText = applyManufacturingConstraints(targetText);
  }
  await writeFile(targetPath, targetText, 'utf8');
}

async function writeProjectFiles() {
  await Promise.all([
    mkdir(projectDir, { recursive: true }),
    mkdir(footprintDir, { recursive: true }),
    mkdir(outputsDir, { recursive: true }),
  ]);

  await copyProjectText('tellmelight_rev_a2.kicad_pro', 'tellmelight_rev_a4.kicad_pro');
  await copyProjectText('tellmelight_rev_a2.kicad_sch', 'tellmelight_rev_a4.kicad_sch');
  await copyProjectText('tellmelight_rev_a2.kicad_sym', 'tellmelight_rev_a4_review.kicad_sym');
  await writeFile(join(projectDir, 'fp-lib-table'), fpLibTable(), 'utf8');
  await writeFile(join(projectDir, 'sym-lib-table'), symLibTable(), 'utf8');
  await writeFile(join(projectDir, 'README.md'), readme(), 'utf8');
  await cp(
    join(sourceDir, 'tellmelight_rev_a2.pretty'),
    footprintDir,
    { recursive: true, force: true },
  );
}

async function rewriteProjectManufacturingConstraints() {
  const projectPath = join(projectDir, 'tellmelight_rev_a4.kicad_pro');
  const text = await readFile(projectPath, 'utf8');
  await writeFile(projectPath, applyManufacturingConstraints(text), 'utf8');
}

function generateBoard() {
  const pythonScript = join(scriptDir, 'generate_rev_a4_board.py');
  const boardPath = join(projectDir, 'tellmelight_rev_a4.kicad_pcb');
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
await rewriteProjectManufacturingConstraints();

console.log(`Generated Rev A4 KiCad hardware candidate at ${projectDir}`);
