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

Rev A4 is a compact routing candidate and JLC preview package for board size, SMT matching, placement, orientation, and silkscreen review. It is not a paid-order release until JLC DFM accepts the via/drill process and the user checks the SMT orientation preview.

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
    .replaceAll('Rev A2', 'Rev A4')
    .replaceAll('"A2"', '"A4"');
}

async function copyProjectText(sourceName, targetName = sourceName) {
  const sourcePath = join(sourceDir, sourceName);
  const targetPath = join(projectDir, targetName);
  const text = await readFile(sourcePath, 'utf8');
  await writeFile(targetPath, applyProjectReplacements(text), 'utf8');
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

console.log(`Generated Rev A4 KiCad hardware candidate at ${projectDir}`);
