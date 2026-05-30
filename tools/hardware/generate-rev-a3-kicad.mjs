import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const kicadRoot = process.env.KICAD_ROOT ?? 'E:\\kicad';
const kicadPython = process.env.KICAD_PYTHON ?? join(kicadRoot, 'bin', 'python.exe');

const sourceDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a2');
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a3');
const footprintDir = join(projectDir, 'tellmelight_rev_a3.pretty');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a3');

function fpLibTable() {
  return `(fp_lib_table
\t(version 7)
\t(lib
\t\t(name "TellMeLight_Rev_A3")
\t\t(type "KiCad")
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a3.pretty")
\t\t(options "")
\t\t(descr "TellMeLight Rev A3 local footprints")
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
\t\t(uri "\${KIPRJMOD}/tellmelight_rev_a3_review.kicad_sym")
\t\t(options "")
\t\t(descr "TellMeLight Rev A3 generic review symbols")
\t)
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
  return `# TellMeLight Rev A3 KiCad Project

Generated: 2026-05-31

## Contents

- \`tellmelight_rev_a3.kicad_pro\`: KiCad project.
- \`tellmelight_rev_a3.kicad_sch\`: Rev A3 review schematic/net plan inherited from Rev A2 and marked for A3.
- \`tellmelight_rev_a3.kicad_sym\`: TellMeLight Rev A3 local symbols for LP5024 and the TUOZHAN RGB LED, created in the Rev A3 symbol checkpoint.
- \`tellmelight_rev_a3_review.kicad_sym\`: Rev A3 generic review symbols for the inherited block-level schematic.
- \`tellmelight_rev_a3.kicad_pcb\`: 76 mm x 56 mm 4-layer PCB candidate.
- \`tellmelight_rev_a3.pretty/\`: local TUOZHAN RGB LED footprint.

## Rev A3 Changes From Rev A2

- Board outline is reduced from 96 mm x 74 mm to 76 mm x 56 mm.
- U6 \`TPD1E05U06DPY\` adds VLED-to-GND TVS/ESD protection.
- R10 \`0R\` explicitly ties VBUS to VLED.
- R9 \`1M\` and C17 \`10nF\` implement the USB-C shell-to-GND RC network.
- Top silkscreen includes a small A1-style separated avatar watermark in an empty optical-face area.
- Top silkscreen title includes the persistent \`By Joey.qiao\` attribution.
- The JLC package is an order-review candidate, but payment is still blocked until the JLC orientation preview is checked.

## Important Boundary

Rev A3 is a compact JLC order-review package for board size, SMT matching, placement, orientation, and silkscreen review. It is not yet the paid-order electrical routing release. The functional routed PCB remains the next hardware step after this package is checked in JLC.

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
    .replaceAll('tellmelight_rev_a2', 'tellmelight_rev_a3')
    .replaceAll('TellMeLight Rev A2', 'TellMeLight Rev A3')
    .replaceAll('TellMeLight_Rev_A2', 'TellMeLight_Rev_A3')
    .replaceAll('Rev A2', 'Rev A3')
    .replaceAll('"A2"', '"A3"');
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

  await copyProjectText('tellmelight_rev_a2.kicad_pro', 'tellmelight_rev_a3.kicad_pro');
  await copyProjectText('tellmelight_rev_a2.kicad_sch', 'tellmelight_rev_a3.kicad_sch');
  await copyProjectText('tellmelight_rev_a2.kicad_sym', 'tellmelight_rev_a3_review.kicad_sym');
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
  const pythonScript = join(scriptDir, 'generate_rev_a3_board.py');
  const boardPath = join(projectDir, 'tellmelight_rev_a3.kicad_pcb');
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

console.log(`Generated Rev A3 KiCad hardware candidate at ${projectDir}`);
