import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const repoRoot = process.cwd();
const netlistPath = join(repoRoot, 'hardware', 'netlists', 'rev_a3_pin_netlist.json');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a3');
const notesDir = join(repoRoot, 'hardware', 'notes');

const netlist = JSON.parse(await readFile(netlistPath, 'utf8'));
const netsByName = new Map(netlist.nets.map((net) => [net.name, net]));

const requiredNetNames = [
  'GND',
  '3V3',
  'VBUS',
  'VLED',
  'I2C0_SDA',
  'I2C0_SCL',
  'USB_DP_MCU',
  'USB_DP_CONN',
  'USB_DM_MCU',
  'USB_DM_CONN',
  'FLASH_CS_N_BOOTSEL',
  'RUN_RESET',
  'LP_IREF',
  'LP_VCAP',
];

function singlePinReviewReason(name) {
  if (name.startsWith('NC_')) {
    return 'Intentional no-connect or reserved no-connect net.';
  }
  if (name.startsWith('GPIO')) {
    return 'Reserved RP2040 GPIO for later feature/debug use.';
  }
  if (name === 'RP2040_VREG_OUT') {
    return 'RP2040 internal regulator output needs final decoupling review in the schematic draft.';
  }
  if (name === 'SHIELD') {
    return 'USB-C shell grounding strategy depends on enclosure and ESD review.';
  }
  return '';
}

const requiredNets = requiredNetNames.map((name) => {
  const net = netsByName.get(name);
  return {
    name,
    pinCount: net?.pins.length ?? 0,
    pins: net?.pins ?? [],
    status: net && net.pins.length >= 2 ? 'OK' : 'MISSING_OR_TOO_FEW_PINS',
  };
});

const reviewSinglePinNets = [];
const unexpectedSinglePinNets = [];

for (const net of netlist.nets) {
  if (net.pins.length !== 1) {
    continue;
  }

  const reason = singlePinReviewReason(net.name);
  if (reason) {
    reviewSinglePinNets.push({
      name: net.name,
      pins: net.pins,
      reason,
    });
  } else {
    unexpectedSinglePinNets.push({
      name: net.name,
      pins: net.pins,
    });
  }
}

const reviewFindings = [];
const vled = netsByName.get('VLED');
if (vled && vled.pins.every((pin) => /^D\d+\.2$/.test(pin))) {
  reviewFindings.push({
    code: 'VLED_SOURCE_MODEL',
    severity: 'YELLOW',
    message: 'VLED source model: VLED currently touches only RGB LED common-anode pads; Rev A3 schematic must explicitly model its VBUS-derived source or rename it to the source rail.',
    pins: vled.pins,
  });
}

reviewFindings.push({
  code: 'JLC_ORIENTATION_PREVIEW_OUT_OF_SCOPE',
  severity: 'RED',
  message: 'JLC orientation preview remains outside this lint and must be checked manually before payment.',
});

const missingRequired = requiredNets.filter((net) => net.status !== 'OK');
const status = unexpectedSinglePinNets.length === 0 && missingRequired.length === 0
  ? 'PASS_WITH_REVIEW_ITEMS'
  : 'FAIL';

const report = {
  project: 'TellMeLight',
  revision: 'A3',
  generated: '2026-05-30',
  status,
  requiredNets,
  missingRequired,
  reviewSinglePinNets: reviewSinglePinNets.sort((a, b) => a.name.localeCompare(b.name)),
  unexpectedSinglePinNets: unexpectedSinglePinNets.sort((a, b) => a.name.localeCompare(b.name)),
  reviewFindings,
};

function markdownList(items, format) {
  if (items.length === 0) {
    return '- None.\n';
  }
  return items.map(format).join('');
}

function note() {
  return `# Rev A3 Netlist Lint

Date: 2026-05-30

Status: ${status}

Rev A2 remains NOT_FOR_ORDER. This lint checks the Rev A3 machine-readable pin netlist for obvious connectivity omissions before a KiCad schematic draft is generated.

## Required Nets

${markdownList(requiredNets, (net) => `- ${net.name}: ${net.status}, ${net.pinCount} pins.\n`)}

## No unexpected single-pin nets

${unexpectedSinglePinNets.length === 0 ? 'No unexpected single-pin nets were found.\n' : markdownList(unexpectedSinglePinNets, (net) => `- ${net.name}: ${net.pins.join(', ')}.\n`)}

## Review single-pin nets

${markdownList(reviewSinglePinNets, (net) => `- ${net.name}: ${net.pins.join(', ')}. ${net.reason}\n`)}

## Review Findings

${markdownList(reviewFindings, (finding) => `- ${finding.severity}: ${finding.code}. ${finding.message}\n`)}

## Boundary

JLC orientation preview remains outside this lint. This report can catch data-model mistakes, but it cannot validate LED rotation, connector orientation, LP5024 pin-1 orientation, crystal loading, USB-C shell grounding, or actual PCB DFM.
`;
}

await Promise.all([
  mkdir(outputsDir, { recursive: true }),
  mkdir(notesDir, { recursive: true }),
]);

await writeFile(join(outputsDir, 'netlist-lint.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(join(notesDir, 'rev-a3-netlist-lint.md'), note(), 'utf8');

if (status !== 'PASS_WITH_REVIEW_ITEMS') {
  throw new Error(`Rev A3 netlist lint failed: ${JSON.stringify({ missingRequired, unexpectedSinglePinNets })}`);
}

console.log('Rev A3 netlist lint completed with review items.');
