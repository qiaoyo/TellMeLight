import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const bomDir = join(repoRoot, 'hardware', 'bom');
const notesDir = join(repoRoot, 'hardware', 'notes');
const outputDir = join(repoRoot, 'hardware', 'outputs', 'rev_a3', 'jlc_preflight');
const assemblyDir = join(outputDir, 'assembly');
const reviewDir = join(outputDir, 'review');

const bomOutput = join(bomDir, 'rev_a3_jlc_bom_preflight.csv');
const cplOutput = join(bomDir, 'rev_a3_jlc_cpl_draft.csv');

const protectionBomRows = [
  ['TPD1E05U06DPY', 'U6', 'Package_SON:Texas_DPY0002A_0.6x1mm_P0.65mm', 'C436349'],
  ['1M', 'R9', 'Resistor_SMD:R_0603_1608Metric', 'C22935'],
  ['10nF', 'C17', 'Capacitor_SMD:C_0603_1608Metric', 'C57112'],
  ['0R', 'R10', 'Resistor_SMD:R_0603_1608Metric', 'C21189'],
];

const protectionCplRows = [
  ['U6', '41.000mm', '61.000mm', 'Bottom', '0', 'DRAFT_ONLY', 'VLED TVS near USB/VLED entry; final PCB placement pending.'],
  ['R9', '76.000mm', '64.000mm', 'Bottom', '0', 'DRAFT_ONLY', 'USB-C shell bleed resistor; final shell pad placement pending.'],
  ['C17', '80.000mm', '64.000mm', 'Bottom', '0', 'DRAFT_ONLY', 'USB-C shell RF shunt capacitor; final shell pad placement pending.'],
  ['R10', '53.500mm', '60.500mm', 'Bottom', '0', 'DRAFT_ONLY', 'VBUS-to-VLED jumper; final PCB placement pending.'],
];

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function posixPath(path) {
  return path.split('\\').join('/');
}

function psQuote(path) {
  return `'${path.replaceAll("'", "''")}'`;
}

async function hashFile(path) {
  const bytes = await readFile(path);
  return createHash('sha256').update(bytes).digest('hex');
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files.sort();
}

async function addManifestFile(path, manifestFiles, source = path) {
  const info = await stat(path);
  manifestFiles.push({
    path: posixPath(relative(outputDir, path)),
    source: source === path ? posixPath(relative(repoRoot, path)) : source,
    bytes: info.size,
    sha256: await hashFile(path),
  });
}

function appendBomRows(baseBomText) {
  return `${baseBomText.trimEnd()}\n${csv(protectionBomRows)}`;
}

function buildDraftCpl(baseCplText) {
  const lines = baseCplText.trimEnd().split(/\r?\n/);
  const header = `${lines[0]},Status,Notes`;
  const carriedRows = lines
    .slice(1)
    .map((line) => `${line},REV_A2_BOARD_PLACED,Carried from Rev A2 board for quote-flow comparison only.`);
  return `${[header, ...carriedRows, ...csv(protectionCplRows).trimEnd().split(/\r?\n/)].join('\n')}\n`;
}

function readme() {
  return `# TellMeLight Rev A3 JLC Preflight Package

Generated: 2026-05-30
Status: PREFLIGHT_NOT_FOR_ORDER

Do not pay for boards from this package. It is only for JLC part matching, rough cost discovery, and checking how the four Rev A3 protection additions appear in the BOM workflow.

## What This Package Is

- \`assembly/rev_a3_jlc_bom_preflight.csv\`: Rev A2 assembly BOM plus U6/R9/C17/R10 protection additions.
- \`assembly/rev_a3_jlc_cpl_draft.csv\`: Rev A2 CPL with draft-only rows for the four new protection parts.
- \`tellmelight_rev_a3_jlc_assembly_preflight.zip\`: convenience zip containing the assembly preflight CSV files.
- \`review/\`: copied Rev A3 protection notes and tonight's JLC checklist.

## What This Package Is Not

- It is not a final Rev A3 Gerber package.
- It is not a final Rev A3 CPL.
- The Rev A2 Gerber can still be used for PCB quote practice, but the Rev A3 protection rows are not physically present on that Rev A2 PCB.
- If JLC reports unmatched placements, extra components, or missing footprints for U6/R9/C17/R10, that is expected until the real Rev A3 KiCad PCB/Gerber/CPL is generated.

## Protection Additions To Check

| Ref | Function | JLC/LCSC candidate |
| --- | --- | --- |
| U6 | VLED TVS/ESD from VLED to GND | C436349 |
| R9 | USB-C shell bleed to GND | C22935 |
| C17 | USB-C shell RF shunt to GND | C57112 |
| R10 | VBUS-to-VLED 0R source link | C21189 |

Use this alongside the Rev A2 Gerber upload only to learn JLC's quote and matcher behavior. Stop before payment.
`;
}

function compressArchive(literalPaths, destination) {
  const literalList = literalPaths.map(psQuote).join(',');
  const command = `Compress-Archive -LiteralPath ${literalList} -DestinationPath ${psQuote(destination)} -Force`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Compress-Archive failed for ${destination}\n${result.stderr || result.stdout}`);
  }
}

await mkdir(bomDir, { recursive: true });
await rm(outputDir, { recursive: true, force: true });
await Promise.all([
  mkdir(assemblyDir, { recursive: true }),
  mkdir(reviewDir, { recursive: true }),
]);

const [revA2Bom, revA2Cpl] = await Promise.all([
  readFile(join(bomDir, 'rev_a2_jlc_bom.csv'), 'utf8'),
  readFile(join(bomDir, 'rev_a2_jlc_cpl.csv'), 'utf8'),
]);

await writeFile(bomOutput, appendBomRows(revA2Bom), 'utf8');
await writeFile(cplOutput, buildDraftCpl(revA2Cpl), 'utf8');

await Promise.all([
  copyFile(bomOutput, join(assemblyDir, basename(bomOutput))),
  copyFile(cplOutput, join(assemblyDir, basename(cplOutput))),
  copyFile(join(notesDir, 'rev-a3-protection-decisions.md'), join(reviewDir, 'rev-a3-protection-decisions.md')),
  copyFile(join(notesDir, 'rev-a3-jlc-tonight-checklist.md'), join(reviewDir, 'rev-a3-jlc-tonight-checklist.md')),
]);

const readmePath = join(outputDir, 'README.md');
await writeFile(readmePath, readme(), 'utf8');

const zipPath = join(outputDir, 'tellmelight_rev_a3_jlc_assembly_preflight.zip');
compressArchive([assemblyDir], zipPath);

const manifestFiles = [];
for (const file of await walkFiles(outputDir)) {
  if (file !== join(outputDir, 'manifest.json')) {
    await addManifestFile(file, manifestFiles);
  }
}

const manifest = {
  project: 'TellMeLight',
  revision: 'A3',
  generated: '2026-05-30',
  status: 'PREFLIGHT_NOT_FOR_ORDER',
  purpose: 'JLC part matching and rough cost discovery for Rev A3 protection additions',
  blockers: [
    'Rev A3 PCB/Gerber/CPL still pending; this package must not be used for payment.',
    'JLC orientation preview remains deferred and must be checked before any final order.',
    'Draft U6/R9/C17/R10 placement rows are not yet backed by real PCB footprints.',
  ],
  files: manifestFiles.sort((a, b) => a.path.localeCompare(b.path)),
};

await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Generated Rev A3 JLC preflight package at ${outputDir}`);
